import { atom } from 'jotai'
import type { CellValue, User, Project, LocationPreset } from './types'

// Current user info (from localStorage)
// Initialize from localStorage, but can be updated
const getUserFromStorage = () => {
  if (typeof window === 'undefined') return null
  const userInfo = localStorage.getItem('user_info')
  return userInfo ? JSON.parse(userInfo) : null
}

export const currentUserAtom = atom<{ id: string; name: string; email?: string; role: string } | null>(
  getUserFromStorage()
)

// Current date for calendar
export const currentDateAtom = atom(new Date())

// Users data
export const usersAtom = atom<User[]>([])

// Calendar entries (userId -> dateISO -> CellValue)
export const entriesAtom = atom<Record<string, Record<string, CellValue>>>({})

// Search text for user filtering
export const searchTextAtom = atom("")

// Selected user IDs for filtering
export const selectedUserIdsAtom = atom<Set<string>>(new Set())

// Show/hide user filter panel
export const showUserFilterAtom = atom(false)

// Show/hide management menu
export const showManagementMenuAtom = atom(false)

// Projects data
export const projectsAtom = atom<Project[]>([])

// Location presets (loaded from API)
export const locationPresetsAtom = atom<LocationPreset[]>([])

// Selected project ID for filtering
export const selectedProjectIdAtom = atom<string | null>(null)

// Show/hide project management modal
export const showProjectManagementAtom = atom(false)

// Editing cell state
export const editingCellAtom = atom<{
  userId: string
  dateISO: string
  userName: string
  date: string
} | null>(null)

// Show/hide user management modal
export const showUserManagementAtom = atom(false)

// Show/hide location management modal
export const showLocationManagementAtom = atom(false)

// Show/hide profile edit modal
export const showProfileEditAtom = atom(false)

// Bulk edit mode state
export const bulkEditModeAtom = atom(false)
export const selectedUserAtom = atom<string | null>(null)
export const selectedDatesAtom = atom<Set<string>>(new Set())
export const showBulkEditorAtom = atom(false)

// Force edit mode for admins (allows editing other users' schedules)
export const forceEditModeAtom = atom(false)

// Derived atoms
// Year and month from current date
export const yearAtom = atom((get) => get(currentDateAtom).getFullYear())
export const monthAtom = atom((get) => get(currentDateAtom).getMonth() + 1)

// Filtered users based on search, project, and user selection
export const filteredUsersAtom = atom((get) => {
  let filtered = get(usersAtom)
  const selectedProjectId = get(selectedProjectIdAtom)
  const projects = get(projectsAtom)
  const searchText = get(searchTextAtom)
  const selectedUserIds = get(selectedUserIdsAtom)

  // Project filter
  if (selectedProjectId) {
    const project = projects.find((p) => p.id === selectedProjectId)
    if (project) {
      filtered = filtered.filter((user) => project.userIds.includes(user.id))
    }
  }

  // Search filter
  if (searchText) {
    filtered = filtered.filter((user) => user.name.toLowerCase().includes(searchText.toLowerCase()))
  }

  // User selection filter
  if (selectedUserIds.size > 0) {
    filtered = filtered.filter((user) => selectedUserIds.has(user.id))
  }

  return filtered
})

// Selected user name
export const selectedUserNameAtom = atom((get) => {
  const selectedUser = get(selectedUserAtom)
  const users = get(usersAtom)
  return selectedUser ? users.find((u) => u.id === selectedUser)?.name : null
})

// Selected project name
export const selectedProjectNameAtom = atom((get) => {
  const selectedProjectId = get(selectedProjectIdAtom)
  const projects = get(projectsAtom)
  return selectedProjectId ? projects.find((p) => p.id === selectedProjectId)?.name : null
})
