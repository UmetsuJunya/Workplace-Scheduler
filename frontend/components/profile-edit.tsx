"use client"

import type React from "react"
import { useState } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { Eye, EyeOff } from "lucide-react"
import { apiClient } from "../lib/api-client"
import { currentUserAtom } from "../lib/atoms"

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true"

interface ProfileEditProps {
  onClose: () => void
}

type ChangeType = 'none' | 'password' | 'email'

export const ProfileEdit: React.FC<ProfileEditProps> = ({ onClose }) => {
  const currentUser = useAtomValue(currentUserAtom)
  const setCurrentUser = useSetAtom(currentUserAtom)
  const [name, setName] = useState(currentUser?.name || "")
  const [changeType, setChangeType] = useState<ChangeType>('none')

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Email change fields
  const [newEmail, setNewEmail] = useState(currentUser?.email || "")

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) return

    // Validate password change
    if (changeType === 'password') {
      if (!currentPassword) {
        alert("現在のパスワードを入力してください")
        return
      }
      if (newPassword !== confirmPassword) {
        alert("新しいパスワードが一致しません")
        return
      }
      if (!newPassword) {
        alert("新しいパスワードを入力してください")
        return
      }
    }

    // Validate email change
    if (changeType === 'email') {
      if (!newEmail || !newEmail.includes('@')) {
        alert("有効なメールアドレスを入力してください")
        return
      }
      if (newEmail === currentUser.email) {
        alert("現在のメールアドレスと同じです")
        return
      }
    }

    setLoading(true)

    try {
      // Verify current password if changing password or email
      if (changeType === 'password' || changeType === 'email') {
        if (!currentPassword) {
          alert("現在のパスワードを入力してください")
          setLoading(false)
          return
        }
        try {
          // Use email for login if available
          const loginIdentifier = currentUser.email || currentUser.name
          await apiClient.login(loginIdentifier, currentPassword)
        } catch (error) {
          alert("現在のパスワードが正しくありません")
          setLoading(false)
          return
        }
      }

      // Update user profile
      const updateData: any = {}

      if (name !== currentUser.name) {
        updateData.name = name
      }

      if (changeType === 'password' && newPassword) {
        updateData.password = newPassword
      }

      if (changeType === 'email' && newEmail) {
        updateData.email = newEmail
      }

      if (Object.keys(updateData).length > 0) {
        await apiClient.updateUser(currentUser.id, updateData)

        // Update current user atom if name or email changed
        const updatedUser = {
          ...currentUser,
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.email && { email: updateData.email })
        }
        setCurrentUser(updatedUser)
        localStorage.setItem("user_info", JSON.stringify(updatedUser))

        alert("プロフィールを更新しました")
        onClose()
      } else {
        alert("変更がありません")
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error)
      alert(`プロフィールの更新に失敗しました: ${error.message || "不明なエラー"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>プロフィール編集</h2>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                ユーザー名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                style={{ width: "100%" }}
              />
            </div>

            {AUTH_ENABLED && (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                    変更内容を選択
                  </label>
                  <select
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value as ChangeType)}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db"
                    }}
                  >
                    <option value="none">変更しない</option>
                    <option value="password">パスワードを変更</option>
                    <option value="email">メールアドレスを変更</option>
                  </select>
                </div>

                {changeType === 'password' && (
                  <>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        現在のパスワード
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={loading}
                          style={{ width: "100%", paddingRight: "2.5rem" }}
                          placeholder="現在のパスワードを入力"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                            color: "#6b7280",
                          }}
                        >
                          {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        新しいパスワード
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={loading}
                          style={{ width: "100%", paddingRight: "2.5rem" }}
                          placeholder="新しいパスワードを入力"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
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
                            color: "#6b7280",
                          }}
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        新しいパスワード（確認）
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={loading}
                          style={{ width: "100%", paddingRight: "2.5rem" }}
                          placeholder="新しいパスワードを再入力"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                            color: "#6b7280",
                          }}
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {changeType === 'email' && (
                  <>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        現在のメールアドレス
                      </label>
                      <input
                        type="text"
                        value={currentUser?.email || "未設定"}
                        disabled
                        style={{
                          width: "100%",
                          backgroundColor: "#f3f4f6",
                          color: "#6b7280"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        新しいメールアドレス
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        disabled={loading}
                        style={{ width: "100%" }}
                        placeholder="新しいメールアドレスを入力"
                        required
                      />
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        現在のパスワード（確認用）
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={loading}
                          style={{ width: "100%", paddingRight: "2.5rem" }}
                          placeholder="パスワードを入力"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                            color: "#6b7280",
                          }}
                        >
                          {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginLeft: "0.5rem" }}
            >
              {loading ? "更新中..." : "更新"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
