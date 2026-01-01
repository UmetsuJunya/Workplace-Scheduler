export interface CellValue {
  am: string | null
  pm: string | null
  note: string
}

export interface User {
  id: string
  name: string
  email?: string
  role?: 'ADMIN' | 'USER'
}

export interface Project {
  id: string
  name: string
  userIds: string[]
}

export interface MonthData {
  users: User[]
  entries: Record<string, Record<string, CellValue>>
}

export interface LocationPreset {
  id: string
  name: string
}

export const DEFAULT_LOCATION_PRESETS: LocationPreset[] = [
  { id: "preset-1", name: "WFH" },
  { id: "preset-2", name: "Musashi-Nakahara" },
  { id: "preset-3", name: "Hofu Office" },
  { id: "preset-4", name: "Paid Leave" },
  { id: "preset-5", name: "Compensatory Leave" },
]
