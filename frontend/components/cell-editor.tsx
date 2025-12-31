"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAtom } from 'jotai'
import { locationPresetsAtom } from '../lib/atoms'
import type { CellValue } from "../lib/types"
import { apiClient } from '../lib/api-client'

interface CellEditorProps {
  value: CellValue | null
  onSave: (value: CellValue | null) => void
  onClose: () => void
  userName: string
  date: string
  isBulkEdit?: boolean
}

export const CellEditor: React.FC<CellEditorProps> = ({
  value,
  onSave,
  onClose,
  userName,
  date,
  isBulkEdit = false,
}) => {
  const [locationPresets, setLocationPresets] = useAtom(locationPresetsAtom)

  // Load location presets from API if not already loaded
  useEffect(() => {
    if (locationPresets.length === 0) {
      const loadPresets = async () => {
        try {
          const presets = await apiClient.getLocationPresets()
          setLocationPresets(presets.map((p: any) => ({ id: p.id, name: p.name })))
        } catch (error) {
          console.error("Failed to load location presets:", error)
        }
      }
      loadPresets()
    }
  }, [])

  const [fullDayMode, setFullDayMode] = useState<boolean>(true)
  const [fullDayValue, setFullDayValue] = useState<string>(() => {
    // AMとPMが同じ場合はその値を使用
    if (value?.am === value?.pm && value?.am) return value.am
    return ""
  })
  const [am, setAm] = useState<string>(value?.am || "")
  const [pm, setPm] = useState<string>(value?.pm || "")
  const [note, setNote] = useState<string>(value?.note || "")

  // 自由入力モードの状態
  const [fullDayFreeInput, setFullDayFreeInput] = useState(false)
  const [amFreeInput, setAmFreeInput] = useState(false)
  const [pmFreeInput, setPmFreeInput] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "Enter" && !e.shiftKey) {
        handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [am, pm, note, fullDayMode, fullDayValue])

  const handleSave = () => {
    if (fullDayMode) {
      if (!fullDayValue && !note) {
        onSave(null)
      } else {
        onSave({
          am: fullDayValue || null,
          pm: fullDayValue || null,
          note: note || "",
        })
      }
    } else {
      if (!am && !pm && !note) {
        onSave(null)
      } else {
        onSave({
          am: am || null,
          pm: pm || null,
          note: note || "",
        })
      }
    }
    onClose()
  }

  const handleClear = () => {
    onSave(null)
    onClose()
  }

  const handleModeSwitch = (toFullDay: boolean) => {
    if (toFullDay) {
      // AM/PMモードから1日全体モードへ
      // AMとPMが同じ場合はその値を、異なる場合はAMの値を使用
      if (am === pm && am) {
        setFullDayValue(am)
      } else if (am) {
        setFullDayValue(am)
      } else if (pm) {
        setFullDayValue(pm)
      }
    } else {
      // 1日全体モードからAM/PMモードへ
      // 現在の値をAMとPMに設定
      setAm(fullDayValue)
      setPm(fullDayValue)
    }
    setFullDayMode(toFullDay)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isBulkEdit ? "複数日を一括編集" : "勤務地を編集"}</h2>
        <div style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          {userName} - {date}
        </div>
        {isBulkEdit && (
          <div
            style={{
              fontSize: "13px",
              color: "#0070f3",
              marginBottom: "16px",
              padding: "8px",
              background: "#f0f9ff",
              borderRadius: "6px",
            }}
          >
            選択した日付の全ユーザーに同じ勤務地を設定します
          </div>
        )}

        <div className="modal-body">
          <div className="form-group">
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button
                type="button"
                className={`btn ${fullDayMode ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleModeSwitch(true)}
                style={{ flex: 1 }}
              >
                1日全体
              </button>
              <button
                type="button"
                className={`btn ${!fullDayMode ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleModeSwitch(false)}
                style={{ flex: 1 }}
              >
                AM/PM分割
              </button>
            </div>
          </div>

          {fullDayMode ? (
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ margin: 0 }}>勤務地</label>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setFullDayFreeInput(!fullDayFreeInput)}
                  style={{ fontSize: "12px" }}
                >
                  {fullDayFreeInput ? "📋 候補から選択" : "✏️ 自由入力"}
                </button>
              </div>
              {fullDayFreeInput ? (
                <input
                  type="text"
                  value={fullDayValue}
                  onChange={(e) => setFullDayValue(e.target.value)}
                  placeholder="勤務地を入力"
                  autoFocus
                />
              ) : (
                <select value={fullDayValue} onChange={(e) => setFullDayValue(e.target.value)} autoFocus>
                  <option value="">なし</option>
                  {locationPresets.map((preset) => (
                    <option key={preset.id} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <>
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ margin: 0 }}>午前 (AM)</label>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setAmFreeInput(!amFreeInput)}
                    style={{ fontSize: "12px" }}
                  >
                    {amFreeInput ? "📋 候補から選択" : "✏️ 自由入力"}
                  </button>
                </div>
                {amFreeInput ? (
                  <input
                    type="text"
                    value={am}
                    onChange={(e) => setAm(e.target.value)}
                    placeholder="勤務地を入力"
                    autoFocus
                  />
                ) : (
                  <select value={am} onChange={(e) => setAm(e.target.value)} autoFocus>
                    <option value="">なし</option>
                    {locationPresets.map((preset) => (
                      <option key={preset.id} value={preset.name}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ margin: 0 }}>午後 (PM)</label>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setPmFreeInput(!pmFreeInput)}
                    style={{ fontSize: "12px" }}
                  >
                    {pmFreeInput ? "📋 候補から選択" : "✏️ 自由入力"}
                  </button>
                </div>
                {pmFreeInput ? (
                  <input
                    type="text"
                    value={pm}
                    onChange={(e) => setPm(e.target.value)}
                    placeholder="勤務地を入力"
                  />
                ) : (
                  <select value={pm} onChange={(e) => setPm(e.target.value)}>
                    <option value="">なし</option>
                    {locationPresets.map((preset) => (
                      <option key={preset.id} value={preset.name}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}

          <div className="form-group">
            <label>備考 (自由入力)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例: クライアント訪問、出張、研修など"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger" onClick={handleClear}>
            クリア
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            キャンセル
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
