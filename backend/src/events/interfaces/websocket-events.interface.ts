import { User, Schedule, Project, LocationPreset } from '@prisma/client';

/**
 * WebSocket event data types
 */

// Schedule events
export type ScheduleEventData = Schedule & {
  user?: User;
};

// User events
export type UserEventData = User;
export interface UserDeletedEventData {
  id: string;
}

// Project events
export type ProjectEventData = Project;
export interface ProjectDeletedEventData {
  id: string;
}

// Location preset events
export type LocationEventData = LocationPreset;
export interface LocationDeletedEventData {
  id: string;
}
export type LocationReorderEventData = LocationPreset[];

/**
 * WebSocket success response
 */
export interface WebSocketResponse {
  success: boolean;
}
