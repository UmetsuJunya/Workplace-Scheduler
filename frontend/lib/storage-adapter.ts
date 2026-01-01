/**
 * API Storage - Backend API integration only
 */

import type { MonthData, Project, User, CellValue } from "./types";
import { apiClient } from "./api-client";

export const saveMonthData = async (yearMonth: string, data: MonthData, currentUserId?: string): Promise<void> => {
  try {
    // Get valid user IDs from the backend
    const validUsers = await apiClient.getUsers();
    const validUserIds = new Set(validUsers.map((u: any) => u.id));

    // Get existing schedules from backend for this month
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const existingSchedules = await apiClient.getSchedules(startDate, endDate);

    // Create a map of existing schedules by userId-date key
    const existingScheduleMap = new Map<string, any>();
    existingSchedules.forEach((schedule: any) => {
      const dateKey = schedule.date.split('T')[0];
      const key = `${schedule.userId}-${dateKey}`;
      existingScheduleMap.set(key, schedule);
    });

    const schedules: Array<{
      userId: string;
      date: string;
      am?: string;
      pm?: string;
      note?: string;
    }> = [];

    // Track which schedules are in the new data
    const newScheduleKeys = new Set<string>();

    // Convert MonthData to schedules array, but only for valid users
    // If currentUserId is provided (non-admin user), only save their schedules
    Object.entries(data.entries).forEach(([userId, userEntries]) => {
      // Skip if user doesn't exist in backend
      if (!validUserIds.has(userId)) {
        return;
      }

      // If currentUserId is provided, only process that user's schedules
      if (currentUserId && userId !== currentUserId) {
        return;
      }

      Object.entries(userEntries).forEach(([dateISO, cellValue]) => {
        const key = `${userId}-${dateISO}`;
        newScheduleKeys.add(key);

        if (cellValue) {
          schedules.push({
            userId,
            date: dateISO,
            am: cellValue.am,
            pm: cellValue.pm,
            note: cellValue.note,
          });
        }
      });
    });

    // Find schedules that exist in backend but not in new data (these should be deleted)
    // If currentUserId is provided, only delete that user's schedules
    const schedulesToDelete: string[] = [];
    existingScheduleMap.forEach((schedule, key) => {
      if (!newScheduleKeys.has(key)) {
        // If currentUserId is provided, only delete if it's the current user's schedule
        if (!currentUserId || schedule.userId === currentUserId) {
          schedulesToDelete.push(schedule.id);
        }
      }
    });

    // Delete removed schedules first
    if (schedulesToDelete.length > 0) {
      console.log(`Deleting ${schedulesToDelete.length} schedules:`, schedulesToDelete);
      await Promise.all(schedulesToDelete.map(id => apiClient.deleteSchedule(id)));
    }

    // Then bulk create/update schedules
    if (schedules.length > 0) {
      console.log(`Creating/updating ${schedules.length} schedules`);
      await apiClient.bulkCreateSchedules(schedules);
    }
  } catch (error) {
    console.error("Failed to save data to API:", error);
    throw error;
  }
};

export const loadMonthData = async (yearMonth: string): Promise<MonthData | null> => {
  try {
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const schedules = await apiClient.getSchedules(startDate, endDate);
    const users = await apiClient.getUsers();

    // Convert API schedules to MonthData format
    const entries: Record<string, Record<string, CellValue>> = {};

    schedules.forEach((schedule: any) => {
      if (!entries[schedule.userId]) {
        entries[schedule.userId] = {};
      }
      // Convert ISO date string to YYYY-MM-DD format
      const dateKey = schedule.date.split('T')[0];
      entries[schedule.userId][dateKey] = {
        am: schedule.am,
        pm: schedule.pm,
        note: schedule.note,
      };
    });

    return {
      users: users.map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
      entries,
    };
  } catch (error) {
    console.error("Failed to load data from API:", error);
    return null;
  }
};


export const saveProjects = async (projects: Project[]): Promise<void> => {
  // Projects are managed via API, no direct save needed
  // This is handled by createProject/updateProject API calls
};

export const loadProjects = async (): Promise<Project[]> => {
  try {
    const projects = await apiClient.getProjects();
    return projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      userIds: p.users?.map((u: any) => u.userId) || [],
    }));
  } catch (error) {
    console.error("Failed to load projects from API:", error);
    return [];
  }
};

export const saveUsers = async (users: User[]): Promise<void> => {
  // Users are managed via API, no direct save needed
  // This is handled by createUser/updateUser API calls
};

export const loadUsers = async (): Promise<User[]> => {
  try {
    const users = await apiClient.getUsers();
    return users.map((u: any) => ({ id: u.id, name: u.name, role: u.role }));
  } catch (error) {
    console.error("Failed to load users from API:", error);
    return [];
  }
};
