import { SearchOrder, SwapRequestStatus } from '@qnoffice/shared';

export interface OpentalkSchedule {
  id: number;
  date: string;
  staffId: number;
  topic: string | null;
  slideUrl: string | null;
  slideStatus: SlideStatus;
  scheduleStatus: ScheduleStatus;
  rejectionReason: string | null;
  slideSubmittedAt: Date | null;
  slideReviewedAt: Date | null;
  reviewedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  staff: {
    id: number;
    email: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  reviewer: {
    id: number;
    email: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
}

export enum SlideStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ScheduleStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  SWAPPED = 'swapped',
  CANCELLED = 'cancelled',
}

export interface OpentalkSwapRequest {
  id: number;
  scheduleId: number;
  requesterId: number;
  targetStaffId: number | null;
  reason: string;
  status: SwapRequestStatus;
  reviewerId: number | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  schedule: OpentalkSchedule;
  requester: {
    id: number;
    email: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  targetStaff: {
    id: number;
    email: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
  reviewer: {
    id: number;
    email: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
}

export interface CreateOpentalkScheduleData {
  date: string;
  staffId: number;
}

export interface UpdateOpentalkScheduleData {
  topic?: string;
  slideUrl?: string;
  slideStatus?: SlideStatus;
  scheduleStatus?: ScheduleStatus;
  rejectionReason?: string;
}

export interface SubmitSlideData {
  topic: string;
  slideUrl: string;
}

export interface CreateSwapRequestData {
  scheduleId: number;
  targetStaffId?: number;
  reason: string;
}

export interface ReviewSwapRequestData {
  status: SwapRequestStatus;
  reviewNote?: string;
}

export interface GetOpentalkSchedulesParams {
  page?: number;
  take?: number;
  order?: SearchOrder;
  staffId?: number;
  slideStatus?: SlideStatus;
  scheduleStatus?: ScheduleStatus;
  fromDate?: string;
  toDate?: string;
}

export interface GenerateSchedulesData {
  startDate: string;
  endDate: string;
}
