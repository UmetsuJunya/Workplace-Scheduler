"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAtom } from 'jotai'
import { locationPresetsAtom } from '../lib/atoms'
import type { LocationPreset } from "../lib/types"
import { apiClient } from '../lib/api-client'
import { wsClient } from '../lib/websocket'

interface LocationManagementProps {
  onClose: () => void
}

export const LocationManagement: React.FC<LocationManagementProps> = ({ onClose }) => {
  const [locationPresets, setLocationPresets] = useAtom(locationPresetsAtom)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [newLocationName, setNewLocationName] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Load location presets from API on mount
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const presets = await apiClient.getLocationPresets()
        setLocationPresets(presets.map((p: any) => ({ id: p.id, name: p.name })))
      } catch (error) {
        console.error("Failed to load location presets:", error)
      }
    }
    loadPresets()

    // Setup WebSocket event listeners for real-time updates
    const handleLocationUpdate = async () => {
      console.log('📡 Location updated via WebSocket, reloading...')
      await loadPresets()
    }

    wsClient.on('location:created', handleLocationUpdate)
    wsClient.on('location:updated', handleLocationUpdate)
    wsClient.on('location:deleted', handleLocationUpdate)
    wsClient.on('location:reordered', handleLocationUpdate)

    return () => {
      wsClient.off('location:created', handleLocationUpdate)
      wsClient.off('location:updated', handleLocationUpdate)
      wsClient.off('location:deleted', handleLocationUpdate)
      wsClient.off('location:reordered', handleLocationUpdate)
    }
  }, [])

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return

    try {
      const newPreset = await apiClient.createLocationPreset({
        name: newLocationName.trim(),
        order: locationPresets.length,
      })

      setLocationPresets([...locationPresets, { id: newPreset.id, name: newPreset.name }])
      setNewLocationName("")
    } catch (error) {
      console.error("Failed to create location preset:", error)
      alert("勤務地の追加に失敗しました")
    }
  }

  const handleStartEdit = (location: LocationPreset) => {
    setEditingId(location.id)
    setEditingName(location.name)
  }

  const handleSaveEdit = async () => {
    if (!editingName.trim() || !editingId) return

    try {
      await apiClient.updateLocationPreset(editingId, { name: editingName.trim() })

      setLocationPresets(
        locationPresets.map((loc) =>
          loc.id === editingId ? { ...loc, name: editingName.trim() } : loc
        )
      )
      setEditingId(null)
      setEditingName("")
    } catch (error) {
      console.error("Failed to update location preset:", error)
      alert("勤務地の更新に失敗しました")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName("")
  }

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("この勤務地を削除しますか？")) return

    try {
      await apiClient.deleteLocationPreset(id)
      setLocationPresets(locationPresets.filter((loc) => loc.id !== id))
    } catch (error) {
      console.error("Failed to delete location preset:", error)
      alert("勤務地の削除に失敗しました")
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newPresets = [...locationPresets]
    ;[newPresets[index - 1], newPresets[index]] = [newPresets[index], newPresets[index - 1]]
    setLocationPresets(newPresets)

    try {
      await apiClient.reorderLocationPresets(newPresets.map(p => p.id))
    } catch (error) {
      console.error("Failed to reorder location presets:", error)
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === locationPresets.length - 1) return
    const newPresets = [...locationPresets]
    ;[newPresets[index], newPresets[index + 1]] = [newPresets[index + 1], newPresets[index]]
    setLocationPresets(newPresets)

    try {
      await apiClient.reorderLocationPresets(newPresets.map(p => p.id))
    } catch (error) {
      console.error("Failed to reorder location presets:", error)
    }
  }

  // ドラッグ&ドロップハンドラー
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newPresets = [...locationPresets]
    const [draggedItem] = newPresets.splice(draggedIndex, 1)
    newPresets.splice(dropIndex, 0, draggedItem)

    setLocationPresets(newPresets)
    setDraggedIndex(null)
    setDragOverIndex(null)

    try {
      await apiClient.reorderLocationPresets(newPresets.map(p => p.id))
    } catch (error) {
      console.error("Failed to reorder location presets:", error)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleSortByName = async () => {
    const sorted = [...locationPresets].sort((a, b) => a.name.localeCompare(b.name, 'ja'))
    setLocationPresets(sorted)

    try {
      await apiClient.reorderLocationPresets(sorted.map(p => p.id))
    } catch (error) {
      console.error("Failed to reorder location presets:", error)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "600px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        <div>
          <h2>勤務地候補の管理</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
            勤務地の候補を追加・編集・削除できます。ドラッグ&ドロップまたは▲▼ボタンで順序を変更できます。
          </p>

          {/* 新規追加フォーム */}
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label>新しい勤務地を追加</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="勤務地名を入力"
                onKeyDown={(e) => {
                  // IME変換中はEnterを無視
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    handleAddLocation()
                  }
                }}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleAddLocation} disabled={!newLocationName.trim()}>
                追加
              </button>
            </div>
          </div>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>

          {/* 勤務地一覧 */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ margin: 0 }}>登録済みの勤務地 ({locationPresets.length}件)</label>
              {locationPresets.length > 1 && (
                <button
                  className="btn btn-sm"
                  onClick={handleSortByName}
                  title="名前順にソート"
                  style={{ fontSize: "12px" }}
                >
                  🔤 名前順
                </button>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "400px",
                overflowY: "auto",
                paddingRight: "4px"
              }}
            >
              {locationPresets.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#999",
                    border: "2px dashed #ddd",
                    borderRadius: "8px",
                  }}
                >
                  勤務地が登録されていません
                </div>
              ) : (
                locationPresets.map((location, index) => (
                  <div
                    key={location.id}
                    draggable={editingId !== location.id}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px",
                      background: draggedIndex === index ? "#e3f2fd" : dragOverIndex === index ? "#f0f9ff" : "#f9f9f9",
                      borderRadius: "8px",
                      border: dragOverIndex === index ? "2px dashed #0070f3" : "1px solid #e0e0e0",
                      cursor: editingId === location.id ? "default" : "grab",
                      opacity: draggedIndex === index ? 0.5 : 1,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* ドラッグハンドル */}
                    <div
                      style={{
                        cursor: editingId === location.id ? "default" : "grab",
                        color: "#999",
                        fontSize: "18px",
                        lineHeight: "1",
                        userSelect: "none",
                        padding: "4px",
                      }}
                      title="ドラッグして移動"
                    >
                      ⋮⋮
                    </div>

                    {/* 順序変更ボタン */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="上に移動"
                        style={{
                          padding: "2px 6px",
                          fontSize: "12px",
                          opacity: index === 0 ? 0.3 : 1,
                        }}
                      >
                        ▲
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === locationPresets.length - 1}
                        title="下に移動"
                        style={{
                          padding: "2px 6px",
                          fontSize: "12px",
                          opacity: index === locationPresets.length - 1 ? 0.3 : 1,
                        }}
                      >
                        ▼
                      </button>
                    </div>

                    {/* 編集モード */}
                    {editingId === location.id ? (
                      <>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          style={{ flex: 1 }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit()
                            } else if (e.key === "Escape") {
                              handleCancelEdit()
                            }
                          }}
                        />
                        <button className="btn btn-sm btn-primary" onClick={handleSaveEdit}>
                          保存
                        </button>
                        <button className="btn btn-sm" onClick={handleCancelEdit}>
                          キャンセル
                        </button>
                      </>
                    ) : (
                      <>
                        {/* 表示モード */}
                        <div style={{ flex: 1, fontWeight: "500" }}>{location.name}</div>
                        <button className="btn btn-sm" onClick={() => handleStartEdit(location)}>
                          編集
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteLocation(location.id)}>
                          削除
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "12px 20px",
            background: "#f0f9ff",
            fontSize: "13px",
            color: "#0070f3",
            borderTop: "1px solid #e0e0e0"
          }}
        >
          💡 ヒント: 勤務地をドラッグ&ドロップで並び替えできます。▲▼ボタンでも変更可能です。よく使う勤務地を上に配置すると選択しやすくなります。
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
