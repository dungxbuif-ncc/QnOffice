import { ScheduleType, SwapRequestStatus } from '../enums';
import { ScheduleEvent } from './schedule.types';
import { Staff } from './staff.types';

export interface SwapRequest {
  id: number;
  fromEventId: number;
  toEventId: number;
  requesterId: number;
  targetStaffId: number;
  reason: string;
  status: SwapRequestStatus;
  type: ScheduleType;
  reviewNote?: string;
  fromEvent?: ScheduleEvent;
  toEvent?: ScheduleEvent;
  requester?: Staff;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICreateSwapRequestDto {
  fromEventId: number;
  toEventId: number;
  reason: string;
  type: ScheduleType;
  targetStaffId?: number;
}

export interface IReviewSwapRequestDto {
  status: SwapRequestStatus;
  reviewNote?: string;
}

export interface ISwapRequestQueryDto {
  requesterId?: number;
  status?: SwapRequestStatus;
  type?: ScheduleType;
}
