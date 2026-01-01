"use client"

import type React from "react"
import { useState } from "react"
import { useAtomValue } from "jotai"
import { Eye, EyeOff, Plus, Trash2, KeyRound } from "lucide-react"
import type { User } from "../lib/types"
import { apiClient } from "../lib/api-client"
import { currentUserAtom } from "../lib/atoms"

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true"

interface UserManagementProps {
  users: User[]
  onUsersChange: (users: User[]) => void
  onClose: () => void
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onUsersChange, onClose }) => {
  const currentUser = useAtomValue(currentUserAtom)
  const isAdmin = !AUTH_ENABLED || currentUser?.role === 'ADMIN'
  const [editingUsers, setEditingUsers] = useState<User[]>([...users])

  // Simple mode (AUTH_ENABLED=false)
  const [newUserName, setNewUserName] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Rich mode (AUTH_ENABLED=true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" })
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null)
  const [resetPasswordValue, setResetPasswordValue] = useState("")
  const [showResetPassword, setShowResetPassword] = useState(false)

  const handleAddUser = async () => {
    if (!newUserName.trim()) return
    if (AUTH_ENABLED && !newUserPassword.trim()) {
      alert("認証が有効な場合、パスワードは必須です")
      return
    }

    try {
      const userData: any = { name: newUserName.trim() }
      if (AUTH_ENABLED && newUserPassword.trim()) {
        userData.password = newUserPassword.trim()
      }
      const newUser = await apiClient.createUser(userData)
      setEditingUsers([...editingUsers, { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }])
      setNewUserName("")
      setNewUserPassword("")
    } catch (error) {
      console.error("Failed to create user:", error)
      alert("ユーザーの追加に失敗しました")
    }
  }

  const handleCreateUser = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      alert("すべての項目を入力してください")
      return
    }

    try {
      const newUser = await apiClient.createUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password.trim(),
      })
      setEditingUsers([...editingUsers, {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }])
      setCreateForm({ name: "", email: "", password: "" })
      setShowCreateModal(false)
    } catch (error) {
      console.error("Failed to create user:", error)
      alert("ユーザーの作成に失敗しました")
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

  const handleRoleChange = async (userId: string, newRole: 'ADMIN' | 'USER') => {
    const user = editingUsers.find(u => u.id === userId)
    const oldRole = user?.role

    // Optimistically update UI
    setEditingUsers(editingUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))

    try {
      await apiClient.updateUser(userId, { role: newRole })
    } catch (error) {
      console.error("Failed to update user role:", error)
      alert("ユーザーの権限変更に失敗しました")
      // Revert on error
      setEditingUsers(editingUsers.map((u) => (u.id === userId ? { ...u, role: oldRole } : u)))
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !resetPasswordValue.trim()) {
      alert("パスワードを入力してください")
      return
    }

    try {
      await apiClient.updateUser(resetPasswordUserId, { password: resetPasswordValue.trim() })
      alert("パスワードをリセットしました")
      setResetPasswordUserId(null)
      setResetPasswordValue("")
    } catch (error) {
      console.error("Failed to reset password:", error)
      alert("パスワードのリセットに失敗しました")
    }
  }

  const handleClose = () => {
    onUsersChange(editingUsers)
    onClose()
  }

  // Rich UI for AUTH_ENABLED=true
  if (AUTH_ENABLED) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px" }}>
          <h2>ユーザー管理</h2>

          <div className="modal-body">
            {/* User List Table */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>ユーザー一覧</h3>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <Plus size={16} /> ユーザー作成
                </button>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #ddd", backgroundColor: "#f9fafb" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>名前</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>メールアドレス</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>権限</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {editingUsers.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "0.75rem" }}>{user.name}</td>
                      <td style={{ padding: "0.75rem", color: "#6b7280" }}>{user.email || "-"}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <select
                          value={user.role || 'USER'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'ADMIN' | 'USER')}
                          disabled={!isAdmin}
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db"
                          }}
                        >
                          <option value="USER">一般ユーザー</option>
                          <option value="ADMIN">管理者</option>
                        </select>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>
                        <button
                          onClick={() => {
                            setResetPasswordUserId(user.id)
                            setResetPasswordValue("")
                          }}
                          style={{
                            padding: "0.5rem",
                            marginRight: "0.5rem",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            background: "white",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem"
                          }}
                          title="パスワードリセット"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveUser(user.id, user.name)}
                          style={{
                            padding: "0.5rem",
                            border: "1px solid #ef4444",
                            borderRadius: "4px",
                            background: "white",
                            color: "#ef4444",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center"
                          }}
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000
                }}
                onClick={() => setShowCreateModal(false)}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "1.5rem",
                    width: "90%",
                    maxWidth: "400px"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0 }}>新規ユーザー作成</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>名前</label>
                      <input
                        type="text"
                        placeholder="名前を入力"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>メールアドレス</label>
                      <input
                        type="email"
                        placeholder="メールアドレスを入力"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>パスワード</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showCreatePassword ? "text" : "password"}
                          placeholder="パスワードを入力"
                          value={createForm.password}
                          onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                          style={{ width: "100%", padding: "0.5rem", paddingRight: "2.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCreatePassword(!showCreatePassword)}
                          style={{
                            position: "absolute",
                            right: "0.5rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                            color: "#6b7280"
                          }}
                        >
                          {showCreatePassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                      <button
                        onClick={() => setShowCreateModal(false)}
                        style={{
                          padding: "0.5rem 1rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          background: "white",
                          cursor: "pointer"
                        }}
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleCreateUser}
                        className="btn btn-primary"
                      >
                        作成
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reset Password Modal */}
            {resetPasswordUserId && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000
                }}
                onClick={() => setResetPasswordUserId(null)}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "1.5rem",
                    width: "90%",
                    maxWidth: "400px"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0 }}>パスワードリセット</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                        ユーザー: {editingUsers.find(u => u.id === resetPasswordUserId)?.name}
                      </label>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>新しいパスワード</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showResetPassword ? "text" : "password"}
                          placeholder="新しいパスワードを入力"
                          value={resetPasswordValue}
                          onChange={(e) => setResetPasswordValue(e.target.value)}
                          style={{ width: "100%", padding: "0.5rem", paddingRight: "2.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          style={{
                            position: "absolute",
                            right: "0.5rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                            color: "#6b7280"
                          }}
                        >
                          {showResetPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                      <button
                        onClick={() => setResetPasswordUserId(null)}
                        style={{
                          padding: "0.5rem 1rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          background: "white",
                          cursor: "pointer"
                        }}
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleResetPassword}
                        className="btn btn-primary"
                      >
                        リセット
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

  // Simple UI for AUTH_ENABLED=false
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
