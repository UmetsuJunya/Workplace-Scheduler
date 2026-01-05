"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import type { CellValue, User, MonthData, Project } from "../lib/types"
import { saveMonthData, loadMonthData, saveProjects, loadProjects, loadUsers } from "../lib/storage-adapter"
import { formatYearMonth, formatDateISO, getDaysInMonth, getDayOfWeek, isWeekend } from "../lib/utils"
import { CellEditor } from "../components/cell-editor"
import { UserManagement } from "../components/user-management"
import { ProjectManagement } from "../components/project-management"
import { LocationManagement } from "../components/location-management"
import { ProfileEdit } from "../components/profile-edit"
import { CustomSelect } from "../components/custom-select"
import { wsClient } from "../lib/websocket"
import { apiClient } from "../lib/api-client"
import {
  currentUserAtom,
  currentDateAtom,
  usersAtom,
  entriesAtom,
  searchTextAtom,
  selectedUserIdsAtom,
  showUserFilterAtom,
  showManagementMenuAtom,
  projectsAtom,
  selectedProjectIdAtom,
  showProjectManagementAtom,
  editingCellAtom,
  showUserManagementAtom,
  showExportImportAtom,
  bulkEditModeAtom,
  selectedUserAtom,
  selectedDatesAtom,
  showBulkEditorAtom,
  yearAtom,
  monthAtom,
  filteredUsersAtom,
  selectedUserNameAtom,
  selectedProjectNameAtom,
  showLocationManagementAtom,
  showProfileEditAtom,
  forceEditModeAtom,
  locationPresetsAtom,
} from "../lib/atoms"

export default function Page() {
  const router = useRouter()
  const currentUser = useAtomValue(currentUserAtom)
  const setCurrentUser = useSetAtom(currentUserAtom)
  const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true"
  const isAdmin = !AUTH_ENABLED || currentUser?.role === 'ADMIN'

  const [currentDate, setCurrentDate] = useAtom(currentDateAtom)
  const [users, setUsers] = useAtom(usersAtom)
  const [entries, setEntries] = useAtom(entriesAtom)
  const [searchText, setSearchText] = useAtom(searchTextAtom)
  const [selectedUserIds, setSelectedUserIds] = useAtom(selectedUserIdsAtom)
  const [showUserFilter, setShowUserFilter] = useAtom(showUserFilterAtom)
  const [showManagementMenu, setShowManagementMenu] = useAtom(showManagementMenuAtom)
  const [projects, setProjects] = useAtom(projectsAtom)
  const [selectedProjectId, setSelectedProjectId] = useAtom(selectedProjectIdAtom)
  const [showProjectManagement, setShowProjectManagement] = useAtom(showProjectManagementAtom)
  const [editingCell, setEditingCell] = useAtom(editingCellAtom)
  const [showUserManagement, setShowUserManagement] = useAtom(showUserManagementAtom)
  const [showProfileEdit, setShowProfileEdit] = useAtom(showProfileEditAtom)
  const [bulkEditMode, setBulkEditMode] = useAtom(bulkEditModeAtom)
  const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom)
  const [selectedDates, setSelectedDates] = useAtom(selectedDatesAtom)
  const [showBulkEditor, setShowBulkEditor] = useAtom(showBulkEditorAtom)
  const [showLocationManagement, setShowLocationManagement] = useAtom(showLocationManagementAtom)
  const [forceEditMode, setForceEditMode] = useAtom(forceEditModeAtom)

  const year = useAtomValue(yearAtom)
  const month = useAtomValue(monthAtom)
  const filteredUsers = useAtomValue(filteredUsersAtom)
  const selectedUserName = useAtomValue(selectedUserNameAtom)
  const selectedProjectName = useAtomValue(selectedProjectNameAtom)
  const locationPresets = useAtomValue(locationPresetsAtom)

  const yearMonth = formatYearMonth(currentDate)

  // Drag & drop state for calendar entries
  const [draggedEntry, setDraggedEntry] = useState<{
    userId: string
    dateISO: string
    value: CellValue
  } | null>(null)
  const [dragOverCell, setDragOverCell] = useState<{
    userId: string
    dateISO: string
  } | null>(null)

  // Flag to prevent WebSocket reload during local saves
  const isSavingRef = useRef(false)

  // Ref for management dropdown click-outside detection
  const managementDropdownRef = useRef<HTMLDivElement>(null)

  // Initialize WebSocket connection on mount
  useEffect(() => {
    wsClient.connect()

    // Setup WebSocket event listeners with debounce to avoid overwriting local changes
    let scheduleReloadTimeout: NodeJS.Timeout
    let userReloadTimeout: NodeJS.Timeout
    let projectReloadTimeout: NodeJS.Timeout

    const handleScheduleUpdated = (data: any) => {
      console.log('📡 Schedule updated via WebSocket:', data)
      // Skip reload if we're currently saving to avoid overwriting local changes
      if (isSavingRef.current) {
        console.log('⏭️  Skipping WebSocket reload during local save')
        return
      }
      // Debounce reload to avoid overwriting local changes
      clearTimeout(scheduleReloadTimeout)
      scheduleReloadTimeout = setTimeout(() => {
        if (!isSavingRef.current) {
          console.log('🔄 Reloading data from server due to WebSocket event')
          loadMonthData(yearMonth).then((savedData) => {
            if (savedData) {
              setUsers(savedData.users)
              setEntries(savedData.entries)
              console.log('✅ Data reloaded from server')
            }
          })
        } else {
          console.log('⏭️  Skipped reload - still saving')
        }
      }, 500)
    }

    const handleUserUpdated = (data: any) => {
      console.log('User updated via WebSocket:', data)
      // Debounce reload
      clearTimeout(userReloadTimeout)
      userReloadTimeout = setTimeout(() => {
        loadUsers().then(setUsers)
      }, 500)
    }

    const handleProjectUpdated = (data: any) => {
      console.log('Project updated via WebSocket:', data)
      // Debounce reload
      clearTimeout(projectReloadTimeout)
      projectReloadTimeout = setTimeout(() => {
        loadProjects().then(setProjects)
      }, 500)
    }

    const handleLocationUpdated = (data: any) => {
      console.log('Location updated via WebSocket:', data)
      // Location presets are managed in their own component
    }

    wsClient.on('schedule:created', handleScheduleUpdated)
    wsClient.on('schedule:updated', handleScheduleUpdated)
    wsClient.on('schedule:deleted', handleScheduleUpdated)
    wsClient.on('user:created', handleUserUpdated)
    wsClient.on('user:updated', handleUserUpdated)
    wsClient.on('user:deleted', handleUserUpdated)
    wsClient.on('project:created', handleProjectUpdated)
    wsClient.on('project:updated', handleProjectUpdated)
    wsClient.on('project:deleted', handleProjectUpdated)
    wsClient.on('location:created', handleLocationUpdated)
    wsClient.on('location:updated', handleLocationUpdated)
    wsClient.on('location:deleted', handleLocationUpdated)
    wsClient.on('location:reordered', handleLocationUpdated)

    return () => {
      // Cleanup timeouts
      clearTimeout(scheduleReloadTimeout)
      clearTimeout(userReloadTimeout)
      clearTimeout(projectReloadTimeout)

      // Cleanup event listeners
      wsClient.off('schedule:created', handleScheduleUpdated)
      wsClient.off('schedule:updated', handleScheduleUpdated)
      wsClient.off('schedule:deleted', handleScheduleUpdated)
      wsClient.off('user:created', handleUserUpdated)
      wsClient.off('user:updated', handleUserUpdated)
      wsClient.off('user:deleted', handleUserUpdated)
      wsClient.off('project:created', handleProjectUpdated)
      wsClient.off('project:updated', handleProjectUpdated)
      wsClient.off('project:deleted', handleProjectUpdated)
      wsClient.off('location:created', handleLocationUpdated)
      wsClient.off('location:updated', handleLocationUpdated)
      wsClient.off('location:deleted', handleLocationUpdated)
      wsClient.off('location:reordered', handleLocationUpdated)
    }
  }, [yearMonth])

  // Load projects on mount
  useEffect(() => {
    const loadData = async () => {
      const savedProjects = await loadProjects()
      setProjects(savedProjects)
    }
    loadData()
  }, [])

  // Load location presets on mount
  const setLocationPresets = useSetAtom(locationPresetsAtom)

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const presets = await apiClient.getLocationPresets()
        setLocationPresets(presets.map((p: any) => ({ id: p.id, name: p.name, color: p.color })))
      } catch (error) {
        console.error("Failed to load location presets:", error)
      }
    }
    loadPresets()
  }, [])

  // Close management dropdown when clicking outside
  useEffect(() => {
    if (!showManagementMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      if (managementDropdownRef.current && !managementDropdownRef.current.contains(event.target as Node)) {
        setShowManagementMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showManagementMenu, setShowManagementMenu])

  // Load users and schedules for current month
  useEffect(() => {
    const loadData = async () => {
      const savedData = await loadMonthData(yearMonth)
      if (savedData) {
        setUsers(savedData.users)
        setEntries(savedData.entries)
      } else {
        // If no data for this month, still load users
        const users = await loadUsers()
        setUsers(users)
        setEntries({})
      }
    }
    loadData()
  }, [yearMonth])

  const saveData = async (newUsers: User[], newEntries: Record<string, Record<string, CellValue>>) => {
    // Set saving flag to prevent WebSocket reload
    isSavingRef.current = true
    console.log('🔒 Saving data, blocking WebSocket reloads')

    const data: MonthData = {
      users: newUsers,
      entries: newEntries,
    }

    // Non-admin users or admins not in force edit mode can only save their own schedules
    const userIdToSave = (!isAdmin || !forceEditMode) && currentUser ? currentUser.id : undefined
    await saveMonthData(yearMonth, data, userIdToSave)

    // Clear saving flag after a delay to ensure all WebSocket events from this save are processed
    setTimeout(() => {
      isSavingRef.current = false
      console.log('🔓 Save complete, allowing WebSocket reloads')
    }, 2000)
  }

  const handleProjectsChange = (newProjects: Project[]) => {
    setProjects(newProjects)
    saveProjects(newProjects)
  }

  const handleLogout = () => {
    if (confirm("ログアウトしますか？")) {
      localStorage.removeItem("access_token")
      localStorage.removeItem("user_info")
      apiClient.setToken(null)
      setCurrentUser(null)
      router.push("/login")
    }
  }

  const handleUserSelect = (userId: string) => {
    if (!bulkEditMode) return

    if (selectedUser === userId) {
      setSelectedUser(null)
      setSelectedDates(new Set())
    } else {
      setSelectedUser(userId)
      setSelectedDates(new Set())
    }
  }

  const handleDateSelect = (dateISO: string) => {
    if (!bulkEditMode || !selectedUser) return

    const newSelected = new Set(selectedDates)
    if (newSelected.has(dateISO)) {
      newSelected.delete(dateISO)
    } else {
      newSelected.add(dateISO)
    }
    setSelectedDates(newSelected)
  }

  const handleToggleBulkMode = () => {
    if (bulkEditMode) {
      setSelectedUser(null)
      setSelectedDates(new Set())
      setBulkEditMode(false)
    } else {
      // When entering bulk edit mode
      // Non-admin users or admins not in force edit mode can only edit their own schedules
      // But if AUTH is disabled, allow selecting any user
      if (AUTH_ENABLED && (!isAdmin || !forceEditMode) && currentUser) {
        setSelectedUser(currentUser.id)
      }
      setBulkEditMode(true)
    }
  }

  const handleBulkEdit = () => {
    if (!selectedUser || selectedDates.size === 0) return
    setShowBulkEditor(true)
  }

  const handleBulkSave = (value: CellValue | null) => {
    if (!selectedUser || selectedDates.size === 0) return

    const newEntries = { ...entries }

    if (!newEntries[selectedUser]) {
      newEntries[selectedUser] = {}
    }

    selectedDates.forEach((dateISO) => {
      if (value === null) {
        delete newEntries[selectedUser][dateISO]
      } else {
        newEntries[selectedUser][dateISO] = value
      }
    })

    setEntries(newEntries)
    saveData(users, newEntries)
    setSelectedUser(null)
    setSelectedDates(new Set())
    setBulkEditMode(false)
    setShowBulkEditor(false)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1))
    setSelectedUser(null)
    setSelectedDates(new Set())
    setBulkEditMode(false)
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1))
    setSelectedUser(null)
    setSelectedDates(new Set())
    setBulkEditMode(false)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [y, m] = e.target.value.split("-").map(Number)
    setCurrentDate(new Date(y, m - 1, 1))
    setSelectedUser(null)
    setSelectedDates(new Set())
    setBulkEditMode(false)
  }

  const handleCellClick = (userId: string, dateISO: string, userName: string) => {
    // Check if user can edit this schedule
    // Non-admin users or admins not in force edit mode can only edit their own schedules
    const canEdit = (!AUTH_ENABLED || !currentUser) ||
                    (isAdmin && forceEditMode) ||
                    userId === currentUser?.id

    if (!canEdit) {
      return // Silently ignore clicks on non-editable cells
    }

    // 一括編集モード中で、かつ選択されたユーザーの場合は日付を選択/解除
    if (bulkEditMode && selectedUser === userId) {
      handleDateSelect(dateISO)
      return
    }

    // 一括編集モード中だが、選択されたユーザーでない場合は何もしない
    if (bulkEditMode) return

    const [y, m, d] = dateISO.split("-").map(Number)
    setEditingCell({
      userId,
      dateISO,
      userName,
      date: `${y}年${m}月${d}日 (${getDayOfWeek(y, m, d)})`,
    })
  }

  const handleCellSave = (value: CellValue | null) => {
    if (!editingCell) return

    // Deep copy entries to avoid mutation issues
    const newEntries: Record<string, Record<string, CellValue>> = {}
    Object.keys(entries).forEach(uid => {
      newEntries[uid] = { ...entries[uid] }
    })

    if (!newEntries[editingCell.userId]) {
      newEntries[editingCell.userId] = {}
    }

    if (value === null) {
      delete newEntries[editingCell.userId][editingCell.dateISO]
      // Clean up empty user entries object
      if (Object.keys(newEntries[editingCell.userId]).length === 0) {
        delete newEntries[editingCell.userId]
      }
    } else {
      newEntries[editingCell.userId][editingCell.dateISO] = value
    }

    setEntries(newEntries)
    saveData(users, newEntries)
  }

  const handleUsersChange = (newUsers: User[]) => {
    setUsers(newUsers)
    saveData(newUsers, entries)
  }


  const daysInMonth = getDaysInMonth(year, month)

  const handleToggleUserFilter = (userId: string) => {
    const newSelected = new Set(selectedUserIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUserIds(newSelected)
  }

  const handleSelectAllUsers = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(users.map((u) => u.id)))
    }
  }

  const handleClearUserFilter = () => {
    setSelectedUserIds(new Set())
  }

  // Drag & drop handlers for calendar entries
  const handleCellDragStart = (e: React.DragEvent, userId: string, dateISO: string, value: CellValue) => {
    if (bulkEditMode) {
      e.preventDefault()
      return
    }
    setDraggedEntry({ userId, dateISO, value })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleCellDragOver = (e: React.DragEvent, userId: string, dateISO: string) => {
    if (!draggedEntry || bulkEditMode) return

    // Only allow drop within the same user
    if (draggedEntry.userId === userId) {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setDragOverCell({ userId, dateISO })
    }
  }

  const handleCellDragLeave = () => {
    setDragOverCell(null)
  }

  const handleCellDrop = (e: React.DragEvent, targetUserId: string, targetDateISO: string) => {
    e.preventDefault()

    if (!draggedEntry || draggedEntry.userId !== targetUserId || bulkEditMode) {
      setDraggedEntry(null)
      setDragOverCell(null)
      return
    }

    // Don't do anything if dropping on the same cell
    if (draggedEntry.dateISO === targetDateISO) {
      setDraggedEntry(null)
      setDragOverCell(null)
      return
    }

    // Deep copy entries to avoid mutation issues
    const newEntries: Record<string, Record<string, CellValue>> = {}
    Object.keys(entries).forEach(uid => {
      newEntries[uid] = { ...entries[uid] }
    })

    if (!newEntries[targetUserId]) {
      newEntries[targetUserId] = {}
    }
    if (!newEntries[draggedEntry.userId]) {
      newEntries[draggedEntry.userId] = {}
    }

    // Get the target cell's value (if any)
    const targetValue = newEntries[targetUserId][targetDateISO] || null

    // Always swap: move dragged entry to target, move target (or null) to source
    newEntries[targetUserId][targetDateISO] = draggedEntry.value

    // If target had a value, move it to source; otherwise, delete source
    if (targetValue) {
      newEntries[draggedEntry.userId][draggedEntry.dateISO] = targetValue
    } else {
      // Target is empty, so source should become empty too
      delete newEntries[draggedEntry.userId][draggedEntry.dateISO]
      // Clean up empty user entries object
      if (Object.keys(newEntries[draggedEntry.userId]).length === 0) {
        delete newEntries[draggedEntry.userId]
      }
    }

    setEntries(newEntries)
    saveData(users, newEntries)
    setDraggedEntry(null)
    setDragOverCell(null)
  }

  const handleCellDragEnd = () => {
    setDraggedEntry(null)
    setDragOverCell(null)
  }

  const renderCellContent = (value: CellValue | null) => {
    if (!value) return null

    const parts: string[] = []

    if (value.am && value.pm && value.am !== value.pm) {
      parts.push(`AM: ${value.am}`)
      parts.push(`PM: ${value.pm}`)
    } else if (value.am) {
      parts.push(value.am)
    } else if (value.pm) {
      parts.push(value.pm)
    }

    if (value.note) {
      parts.push(`📝 ${value.note}`)
    }

    return parts.join("\n")
  }

  // Get background colors for a cell based on location preset
  const getCellBackgroundColors = (value: CellValue | null): { am: string | undefined; pm: string | undefined; hasSplit: boolean } => {
    if (!value) return { am: undefined, pm: undefined, hasSplit: false }

    const amColor = value.am ? locationPresets.find(p => p.name === value.am)?.color : undefined
    const pmColor = value.pm ? locationPresets.find(p => p.name === value.pm)?.color : undefined

    // Check if we have different AM and PM values with colors
    const hasSplit = value.am && value.pm && value.am !== value.pm && (amColor || pmColor)

    return { am: amColor, pm: pmColor, hasSplit: !!hasSplit }
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>月間勤務地カレンダー</h1>

        <div className="controls-compact">
          {/* 月選択 */}
          <div className="control-group">
            <button onClick={handlePrevMonth} className="btn-icon" title="前月">
              ◀
            </button>
            <input type="month" value={yearMonth} onChange={handleMonthChange} className="month-input" />
            <div className="month-display">
              {year}年 {month}月
            </div>
            <button onClick={handleNextMonth} className="btn-icon" title="次月">
              ▶
            </button>
          </div>

          {/* フィルター */}
          <div className="control-group">
            <CustomSelect
              value={selectedProjectId || ""}
              onChange={(value) => setSelectedProjectId(value || null)}
              options={[
                { value: "", label: "全プロジェクト" },
                ...projects.map((project) => ({
                  value: project.id,
                  label: `📁 ${project.name} (${project.userIds.length})`
                }))
              ]}
              placeholder="プロジェクトを選択"
              maxVisibleItems={10}
            />

            <button
              className={`btn ${selectedUserIds.size > 0 ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setShowUserFilter(!showUserFilter)}
            >
              👥 {selectedUserIds.size > 0 ? `${selectedUserIds.size}人` : "絞り込み"}
            </button>

            <input
              type="text"
              placeholder="🔍 検索..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
          </div>

          {/* アクション */}
          <div className="control-group">
            <button className={`btn ${bulkEditMode ? "btn-primary" : "btn-secondary"}`} onClick={handleToggleBulkMode}>
              ✏️ {bulkEditMode ? "一括編集モード ON" : "一括編集モード"}
            </button>

            <div className="management-dropdown" ref={managementDropdownRef}>
              <button className="btn btn-secondary" onClick={() => setShowManagementMenu(!showManagementMenu)}>
                ⚙️
              </button>
              {showManagementMenu && (
                <div className="dropdown-menu">
                  <button
                    onClick={() => {
                      setShowProjectManagement(true)
                      setShowManagementMenu(false)
                    }}
                    className="dropdown-item"
                  >
                    📁 プロジェクト管理
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowUserManagement(true)
                        setShowManagementMenu(false)
                      }}
                      className="dropdown-item"
                    >
                      👤 ユーザー管理
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowLocationManagement(true)
                      setShowManagementMenu(false)
                    }}
                    className="dropdown-item"
                  >
                    📍 勤務地管理
                  </button>
                  {AUTH_ENABLED && isAdmin && (
                    <button
                      onClick={() => {
                        setForceEditMode(!forceEditMode)
                      }}
                      className="dropdown-item"
                      style={{
                        borderTop: "1px solid #ddd",
                        marginTop: "4px",
                        paddingTop: "8px",
                        backgroundColor: forceEditMode ? "#fef3c7" : "transparent"
                      }}
                    >
                      {forceEditMode ? "🔓" : "🔒"} 強制変更モード{forceEditMode ? "（ON）" : ""}
                    </button>
                  )}
                  {AUTH_ENABLED && (
                    <>
                      <button
                        onClick={() => {
                          setShowProfileEdit(true)
                          setShowManagementMenu(false)
                        }}
                        className="dropdown-item"
                        style={{ borderTop: "1px solid #ddd", marginTop: "4px", paddingTop: "8px" }}
                      >
                        👤 プロフィール編集
                      </button>
                      <button
                        onClick={() => {
                          setShowManagementMenu(false)
                          handleLogout()
                        }}
                        className="dropdown-item"
                      >
                        🚪 ログアウト
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ステータス表示 */}
        {(selectedProjectName || bulkEditMode) && (
          <div className="status-bar">
            {selectedProjectName && <div className="status-item status-project">📁 {selectedProjectName}</div>}
            {bulkEditMode && (
              <div className="status-item status-edit">
                {!selectedUser && (!AUTH_ENABLED || (isAdmin && forceEditMode)) && "① ユーザー名をクリックして選択"}
                {selectedUser && selectedDates.size === 0 && `${(!AUTH_ENABLED || (isAdmin && forceEditMode)) ? '② ' : ''}${selectedUserName} のスケジュール枠をクリックして日付を選択`}
                {selectedUser && selectedDates.size > 0 && (
                  <>
                    {selectedUserName} | {selectedDates.size}日選択中
                    <button className="btn btn-sm btn-primary btn-pulse ml-2" onClick={handleBulkEdit}>
                      {selectedDates.size}日を編集
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ユーザー絞り込みパネル */}
        {showUserFilter && (
          <div className="user-filter-panel">
            <div className="user-filter-header">
              <h3>表示ユーザー</h3>
              <div className="user-filter-actions">
                <button className="btn btn-sm" onClick={handleSelectAllUsers}>
                  {selectedUserIds.size === users.length ? "解除" : "全選択"}
                </button>
                {selectedUserIds.size > 0 && (
                  <button className="btn btn-sm" onClick={handleClearUserFilter}>
                    クリア
                  </button>
                )}
                <button className="btn btn-sm btn-primary" onClick={() => setShowUserFilter(false)}>
                  ✓ 決定
                </button>
              </div>
            </div>
            <div className="user-filter-list">
              {users.map((user) => (
                <label key={user.id} className="user-filter-item">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.has(user.id)}
                    onChange={() => handleToggleUserFilter(user.id)}
                  />
                  <span>{user.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="calendar-grid-container">
        <div className="calendar-grid">
          {/* Header row */}
          <div className="grid-header">
            <div className="header-cell user-column">ユーザー</div>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateISO = formatDateISO(year, month, day)
              const dayOfWeek = getDayOfWeek(year, month, day)
              const weekend = isWeekend(year, month, day)
              return (
                <div
                  key={dateISO}
                  className={`header-cell day-column ${weekend ? "weekend" : ""}`}
                  style={{ cursor: "default" }}
                >
                  {day}
                  <div className="day-of-week">({dayOfWeek})</div>
                </div>
              )
            })}
          </div>

          {/* Data rows */}
          <div className="grid-body">
            {filteredUsers.map((user) => (
              <div key={user.id} className="grid-row">
                <div
                  className={`grid-cell user-column ${bulkEditMode ? "selectable" : ""} ${selectedUser === user.id ? "selected" : ""}`}
                  onClick={() => handleUserSelect(user.id)}
                  style={{ cursor: bulkEditMode ? "pointer" : "default" }}
                >
                  {user.name}
                </div>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dateISO = formatDateISO(year, month, day)
                  const weekend = isWeekend(year, month, day)
                  const cellValue = entries[user.id]?.[dateISO] || null
                  const content = renderCellContent(cellValue)
                  const isSelected = selectedUser === user.id && selectedDates.has(dateISO)
                  const isDragging = draggedEntry?.userId === user.id && draggedEntry?.dateISO === dateISO
                  const isDragOver = dragOverCell?.userId === user.id && dragOverCell?.dateISO === dateISO
                  const isSelectableInBulkMode = bulkEditMode && selectedUser === user.id

                  // Check if this cell is editable by the current user
                  const canEdit = (!AUTH_ENABLED || !currentUser) ||
                                  (isAdmin && forceEditMode) ||
                                  user.id === currentUser?.id

                  // Get background colors for AM/PM split
                  const bgColors = getCellBackgroundColors(cellValue)
                  const hasUniformColor = bgColors.am && bgColors.pm && bgColors.am === bgColors.pm
                  const singleColor = hasUniformColor ? bgColors.am : (bgColors.am || bgColors.pm)

                  return (
                    <div
                      key={dateISO}
                      draggable={!!content && !bulkEditMode && canEdit}
                      onDragStart={(e) => cellValue && canEdit && handleCellDragStart(e, user.id, dateISO, cellValue)}
                      onDragOver={(e) => canEdit && handleCellDragOver(e, user.id, dateISO)}
                      onDragLeave={handleCellDragLeave}
                      onDrop={(e) => canEdit && handleCellDrop(e, user.id, dateISO)}
                      onDragEnd={handleCellDragEnd}
                      className={`grid-cell day-column ${weekend ? "weekend" : ""} ${content ? "has-content" : ""} ${isSelected ? "selected" : ""} ${isDragging ? "dragging" : ""} ${isDragOver ? "drag-over" : ""} ${isSelectableInBulkMode ? "selectable" : ""} ${!canEdit ? "non-editable" : ""} ${bgColors.hasSplit ? "split-background" : ""}`}
                      onClick={() => handleCellClick(user.id, dateISO, user.name)}
                      title={
                        bulkEditMode
                          ? selectedUser === user.id
                            ? "クリックして日付を選択"
                            : "一括編集モード中"
                          : content
                            ? "ドラッグで移動 / クリックして編集"
                            : "クリックして編集"
                      }
                      style={{
                        cursor: bulkEditMode
                          ? selectedUser === user.id
                            ? "pointer"
                            : "not-allowed"
                          : content
                            ? "grab"
                            : "pointer",
                        opacity: isDragging ? 0.5 : 1,
                        backgroundColor: !bgColors.hasSplit ? singleColor : undefined,
                      }}
                    >
                      {bgColors.hasSplit && (
                        <>
                          <div className="cell-bg-am" style={{ backgroundColor: bgColors.am }} />
                          <div className="cell-bg-pm" style={{ backgroundColor: bgColors.pm }} />
                        </>
                      )}
                      {content && <div className="cell-content">{content}</div>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingCell && (
        <CellEditor
          value={entries[editingCell.userId]?.[editingCell.dateISO] || null}
          onSave={handleCellSave}
          onClose={() => setEditingCell(null)}
          userName={editingCell.userName}
          date={editingCell.date}
        />
      )}

      {showBulkEditor && selectedUserName && (
        <CellEditor
          value={null}
          onSave={handleBulkSave}
          onClose={() => {
            setShowBulkEditor(false)
          }}
          userName={selectedUserName}
          date={`選択した${selectedDates.size}日`}
          isBulkEdit={true}
        />
      )}

      {showUserManagement && (
        <UserManagement users={users} onUsersChange={handleUsersChange} onClose={() => setShowUserManagement(false)} />
      )}

      {showProjectManagement && (
        <ProjectManagement
          projects={projects}
          users={users}
          onProjectsChange={handleProjectsChange}
          onClose={() => setShowProjectManagement(false)}
        />
      )}

      {showLocationManagement && (
        <LocationManagement onClose={() => setShowLocationManagement(false)} />
      )}

      {showProfileEdit && (
        <ProfileEdit onClose={() => setShowProfileEdit(false)} />
      )}
    </div>
  )
}
