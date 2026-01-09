import { CycleStatus, EventStatus, ScheduleType } from '../enums';
import { Staff } from './staff.types';

export interface ScheduleCycle<T = any> {
  id: number;
  name: string;
  type: ScheduleType;
  status: CycleStatus;
  description?: string;
  events?: ScheduleEvent<T>[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ScheduleEvent<T = any> {
  id: number;
  title: string;
  type: ScheduleType;
  cycleId: number;
  eventDate: string;
  status: EventStatus;
  notes?: string;
  metadata: T | null;
  eventParticipants?: ScheduleEventParticipant[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ScheduleEventParticipant {
  id: number;
  eventId: number;
  staffId: number;
  staff?: Staff;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICreateCycleDto {
  name: string;
  type: ScheduleType;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface IUpdateCycleDto {
  name?: string;
  status?: CycleStatus;
  description?: string;
}

export interface ICreateEventDto {
  title: string;
  type: ScheduleType;
  cycleId: number;
  eventDate: string;
  participantIds: number[];
  notes?: string;
}

export interface IUpdateEventDto {
  title?: string;
  eventDate?: string;
  status?: EventStatus;
  notes?: string;
  participantIds?: number[];
}

export interface ISwapEventsDto {
  eventId1: number;
  eventId2: number;
}

import { SearchParams } from './pagination.types';

export interface IScheduleQueryDto extends SearchParams {
  type?: string;
  status?: EventStatus;
  cycleId?: number;
  startDate?: string;
  endDate?: string;
}
