"use client"

import type React from "react"
import { useState } from "react"
import type { User } from "../lib/types"
import { apiClient } from "../lib/api-client"

interface UserManagementProps {
  users: User[]
  onUsersChange: (users: User[]) => void
  onClose: () => void
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onUsersChange, onClose }) => {
  const [editingUsers, setEditingUsers] = useState<User[]>([...users])
  const [newUserName, setNewUserName] = useState("")

  const handleAddUser = async () => {
    if (!newUserName.trim()) return

    try {
      const newUser = await apiClient.createUser({ name: newUserName.trim() })
      setEditingUsers([...editingUsers, { id: newUser.id, name: newUser.name }])
      setNewUserName("")
    } catch (error) {
      console.error("Failed to create user:", error)
      alert("ユーザーの追加に失敗しました")
    }
  }

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!confirm(`${userName}を削除してもよろしいですか?`)) return

    try {
      await apiClient.deleteUser(userId)
      setEditingUsers(editingUsers.filter((u) => u.id !== userId))
    } catch (error) {
      console.error("Failed to delete user:", error)
      alert("ユーザーの削除に失敗しました")
    }
  }

  const handleRenameUser = async (userId: string, newName: string) => {
    const oldName = editingUsers.find(u => u.id === userId)?.name
    setEditingUsers(editingUsers.map((u) => (u.id === userId ? { ...u, name: newName } : u)))

    // Update on blur or after debounce - for now just update immediately
    if (newName.trim() && newName !== oldName) {
      try {
        await apiClient.updateUser(userId, { name: newName.trim() })
      } catch (error) {
        console.error("Failed to update user:", error)
        // Revert on error
        setEditingUsers(editingUsers.map((u) => (u.id === userId ? { ...u, name: oldName || "" } : u)))
      }
    }
  }

  const handleClose = () => {
    onUsersChange(editingUsers)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>ユーザー管理</h2>

        <div className="modal-body">
          <div className="user-list">
            {editingUsers.map((user) => (
              <div key={user.id} className="user-item">
                <input type="text" value={user.name} onChange={(e) => handleRenameUser(user.id, e.target.value)} />
                <button onClick={() => handleRemoveUser(user.id, user.name)}>削除</button>
              </div>
            ))}
          </div>

          <div className="add-user-form">
            <input
              type="text"
              placeholder="新しいユーザー名"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              onKeyDown={(e) => {
                // IME変換中はEnterを無視
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  handleAddUser()
                }
              }}
            />
            <button className="btn btn-primary" onClick={handleAddUser}>
              追加
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
