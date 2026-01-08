import {
  CycleStatus,
  EventStatus,
  ScheduleType,
  SwapRequestStatus,
} from '../enums';
import { ScheduleEvent, ScheduleEventParticipant } from './schedule.types';
import { Staff } from './staff.types';

export interface OpentalkSlideSubmission {
  id: number;
  eventId: number;
  slidesUrl: string;
  topic?: string;
  submittedBy: number;
  notes?: string;
  event?: ScheduleEvent;
  submitter?: Staff;
  created_at: string;
  updated_at: string;
}

export interface SwapRequest {
  id: number;
  fromEventId: number;
  toEventId: number;
  requesterId: number;
  reason: string;
  status: SwapRequestStatus;
  reviewNote?: string;
  fromEvent?: ScheduleEvent;
  toEvent?: ScheduleEvent;
  requester?: Staff;
  created_at: string;
  updated_at: string;
}

export interface OpentalkEvent extends ScheduleEvent {
  type: ScheduleType.OPENTALK;
  eventParticipants?: ScheduleEventParticipant[];
  participants?: Staff[];
}

export interface CreateOpentalkCycleDto {
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  status?: CycleStatus;
}

export interface UpdateOpentalkCycleDto {
  name?: string;
  description?: string;
  status?: CycleStatus;
}

export interface CreateOpentalkEventDto {
  title: string;
  type?: ScheduleType.OPENTALK;
  cycleId: number;
  eventDate: string;
  status?: EventStatus;
  notes?: string;
  participantIds?: number[];
}

export interface UpdateOpentalkEventDto {
  title?: string;
  eventDate?: string;
  status?: EventStatus;
  notes?: string;
  participantIds?: number[];
}

export interface SwapOpentalkDto {
  eventId1: number;
  eventId2: number;
}

export interface CreateSlideSubmissionDto {
  eventId: number;
  slidesUrl: string;
  topic?: string;
  submittedBy: number;
  notes?: string;
}

export interface UpdateSlideSubmissionDto {
  slidesUrl?: string;
  topic?: string;
  notes?: string;
}

export interface CreateSwapRequestDto {
  scheduleId: number;
  targetStaffId?: number;
  reason: string;
}

export interface CreateOpentalkScheduleDto {
  date: string;
  staffId: number;
}

export interface SubmitSlideDto {
  eventId: number;
  slidesUrl: string;
  topic?: string;
  notes?: string;
}
