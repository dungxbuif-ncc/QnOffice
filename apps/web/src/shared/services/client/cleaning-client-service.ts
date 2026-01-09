import baseApi from '@/shared/services/client/base-api';
import { ApiResponse } from '@qnoffice/shared';

export interface CleaningEvent {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  status: string;
  type: string;
  cycleId: number;
  notes?: string;
  eventParticipants?: Array<{
    staffId: number;
    staff: {
      id: number;
      email: string;
      user?: {
        email: string;
        name: string;
      };
    };
  }>;
}

export interface CleaningSlide {
  id: number;
  slideUrl: string;
  eventId: number;
  presentedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  eventDate?: string;
  status?: string;
  notes?: string;
}

export interface SwapEventsDto {
  eventId1: number;
  eventId2: number;
}

class CleaningClientService {
  private readonly baseUrl = '/cleaning';

  async updateEvent(eventId: number, data: UpdateEventDto) {
    return baseApi.put<ApiResponse<CleaningEvent>>(
      `${this.baseUrl}/events/${eventId}`,
      data,
    );
  }

  async swapEvents(event1Id: number, event2Id: number) {
    return baseApi.post<ApiResponse<void>>(`${this.baseUrl}/swap`, {
      event1Id,
      event2Id,
    });
  }

  async getSwapRequests(params?: any) {
    return baseApi.get<any>(`${this.baseUrl}/swap-requests`, { params });
  }

  async getUserSchedules(staffId: number) {
    return baseApi.get<ApiResponse<CleaningEvent[]>>(`${this.baseUrl}/events`, {
      params: { participantId: staffId },
    });
  }

  async createSwapRequest(data: any) {
    return baseApi.post<any>(`${this.baseUrl}/swap-requests`, data);
  }

  async reviewSwapRequest(
    id: number,
    data: { status: string; reviewNote?: string },
  ) {
    return baseApi.put<any>(`${this.baseUrl}/swap-requests/${id}/review`, data);
  }
}

export const cleaningClientService = new CleaningClientService();
