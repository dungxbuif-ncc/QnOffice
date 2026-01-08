import { CycleStatus, EventStatus, ScheduleType } from '../enums';
import { Staff } from './staff.types';

export interface ScheduleCycle {
  id: number;
  name: string;
  type: ScheduleType;
  status: CycleStatus;
  description?: string;
  events?: ScheduleEvent[];
  created_at: string;
  updated_at: string;
}

export interface ScheduleEvent {
  id: number;
  title: string;
  type: ScheduleType;
  cycleId: number;
  eventDate: string;
  status: EventStatus;
  notes?: string;
  cycle?: ScheduleCycle;
  eventParticipants?: ScheduleEventParticipant[];
  created_at: string;
  updated_at: string;
}

export interface ScheduleEventParticipant {
  id: number;
  eventId: number;
  staffId: number;
  staff?: Staff;
  created_at: string;
  updated_at: string;
}

export interface CreateCycleDto {
  name: string;
  type: ScheduleType;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface UpdateCycleDto {
  name?: string;
  status?: CycleStatus;
  description?: string;
}

export interface CreateEventDto {
  title: string;
  type: ScheduleType;
  cycleId: number;
  eventDate: string;
  participantIds: number[];
  notes?: string;
}

export interface UpdateEventDto {
  title?: string;
  eventDate?: string;
  status?: EventStatus;
  notes?: string;
  participantIds?: number[];
}

export interface SwapEventsDto {
  eventId1: number;
  eventId2: number;
}
