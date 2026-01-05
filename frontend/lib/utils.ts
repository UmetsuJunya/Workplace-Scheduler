import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import HolidayJp from "@holiday-jp/holiday_jp"

export const formatYearMonth = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export const formatDateISO = (year: number, month: number, day: number): string => {
  const monthStr = String(month).padStart(2, "0")
  const dayStr = String(day).padStart(2, "0")
  return `${year}-${monthStr}-${dayStr}`
}

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate()
}

export const getDayOfWeek = (year: number, month: number, day: number): string => {
  const date = new Date(year, month - 1, day)
  const days = ["日", "月", "火", "水", "木", "金", "土"]
  return days[date.getDay()]
}

export const isWeekend = (year: number, month: number, day: number): boolean => {
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

export const isHoliday = (year: number, month: number, day: number): boolean => {
  const date = new Date(year, month - 1, day)
  return HolidayJp.isHoliday(date)
}

export const getHolidayName = (year: number, month: number, day: number): string | null => {
  const date = new Date(year, month - 1, day)
  const holiday = HolidayJp.between(date, date)[0]
  return holiday ? holiday.name : null
}

export const generateUserId = (): string => {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
