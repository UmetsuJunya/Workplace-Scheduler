"use client"
import { useState } from "react"
import type { Project, User } from "../lib/types"
import { apiClient } from "../lib/api-client"

interface ProjectManagementProps {
  projects: Project[]
  users: User[]
  onProjectsChange: (projects: Project[]) => void
  onClose: () => void
}

export function ProjectManagement({ projects, users, onProjectsChange, onClose }: ProjectManagementProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [newProjectName, setNewProjectName] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert("プロジェクト名を入力してください")
      return
    }

    try {
      const newProject = await apiClient.createProject({
        name: newProjectName.trim(),
        userIds: Array.from(selectedUserIds),
      })

      onProjectsChange([...projects, {
        id: newProject.id,
        name: newProject.name,
        userIds: newProject.users?.map((u: any) => u.id) || [],
      }])
      setNewProjectName("")
      setSelectedUserIds(new Set())
      setShowForm(false)
    } catch (error) {
      console.error("Failed to create project:", error)
      alert("プロジェクトの作成に失敗しました")
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setNewProjectName(project.name)
    setSelectedUserIds(new Set(project.userIds))
    setShowForm(true)
  }

  const handleUpdateProject = async () => {
    if (!editingProject || !newProjectName.trim()) {
      alert("プロジェクト名を入力してください")
      return
    }

    try {
      const updatedProject = await apiClient.updateProject(editingProject.id, {
        name: newProjectName.trim(),
        userIds: Array.from(selectedUserIds),
      })

      const updatedProjects = projects.map((p) =>
        p.id === editingProject.id ? {
          id: updatedProject.id,
          name: updatedProject.name,
          userIds: updatedProject.users?.map((u: any) => u.id) || [],
        } : p,
      )

      onProjectsChange(updatedProjects)
      setEditingProject(null)
      setNewProjectName("")
      setSelectedUserIds(new Set())
      setShowForm(false)
    } catch (error) {
      console.error("Failed to update project:", error)
      alert("プロジェクトの更新に失敗しました")
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (confirm("このプロジェクトを削除しますか？")) {
      try {
        await apiClient.deleteProject(projectId)
        onProjectsChange(projects.filter((p) => p.id !== projectId))
      } catch (error) {
        console.error("Failed to delete project:", error)
        alert("プロジェクトの削除に失敗しました")
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingProject(null)
    setNewProjectName("")
    setSelectedUserIds(new Set())
    setShowForm(false)
  }

  const handleNewProject = () => {
    setEditingProject(null)
    setNewProjectName("")
    setSelectedUserIds(new Set())
    setShowForm(true)
  }

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUserIds(newSelected)
  }

  const selectAllUsers = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(users.map((u) => u.id)))
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "900px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <h2>プロジェクト管理</h2>

        <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>
          {showForm ? (
            <div className="project-form">
              <h3>{editingProject ? "プロジェクトを編集" : "新しいプロジェクトを作成"}</h3>
              <div className="form-group">
                <label>プロジェクト名</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="プロジェクト名を入力"
                />
              </div>

              <div className="form-group">
                <div className="user-selection-header">
                  <label>プロジェクトメンバー</label>
                  <button className="btn btn-sm" onClick={selectAllUsers}>
                    {selectedUserIds.size === users.length ? "全て解除" : "全て選択"}
                  </button>
                </div>
                <div className="user-selection-list">
                  {users.map((user) => (
                    <label key={user.id} className="user-selection-item">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                      />
                      <span>{user.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                {editingProject ? (
                  <>
                    <button className="btn btn-primary" onClick={handleUpdateProject}>
                      更新
                    </button>
                    <button className="btn btn-secondary" onClick={handleCancelEdit}>
                      キャンセル
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={handleCreateProject}>
                      作成
                    </button>
                    <button className="btn btn-secondary" onClick={handleCancelEdit}>
                      キャンセル
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="project-list">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0 }}>プロジェクト一覧 ({projects.length}件)</h3>
                <button className="btn btn-primary" onClick={handleNewProject}>
                  ＋ 新規作成
                </button>
              </div>
              {projects.length === 0 ? (
                <p className="empty-message">プロジェクトがありません</p>
              ) : (
                <div className="projects-grid">
                  {projects.map((project) => (
                    <div key={project.id} className="project-card">
                      <div className="project-info">
                        <h4>{project.name}</h4>
                        <p className="member-count">{project.userIds.length}人のメンバー</p>
                        <div className="member-list">
                          {project.userIds.map((userId) => {
                            const user = users.find((u) => u.id === userId)
                            return user ? (
                              <span key={userId} className="member-badge">
                                {user.name}
                              </span>
                            ) : null
                          })}
                        </div>
                      </div>
                      <div className="project-actions">
                        <button className="btn btn-sm" onClick={() => handleEditProject(project)}>
                          編集
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteProject(project.id)}>
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
