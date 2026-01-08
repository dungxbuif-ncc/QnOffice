import baseApi from '@/shared/services/client/base-api';
import { ApiResponse } from '@qnoffice/shared';

export interface OpentalkEvent {
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

export interface OpentalkSlide {
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

class OpentalkClientService {
  private readonly baseUrl = '/api/opentalk';

  async updateEvent(eventId: number, data: UpdateEventDto) {
    return baseApi.put<ApiResponse<OpentalkEvent>>(
      `${this.baseUrl}/events/${eventId}`,
      data,
    );
  }

  async swapEvents(eventId1: number, eventId2: number) {
    return baseApi.post<ApiResponse<void>>(`${this.baseUrl}/events/swap`, {
      eventId1,
      eventId2,
    });
  }

  async updateSlide(
    eventId: number,
    data: { slideUrl?: string; presentedAt?: string },
  ) {
    return baseApi.put<ApiResponse<OpentalkSlide>>(
      `${this.baseUrl}/events/${eventId}/slide`,
      data,
    );
  }

  async getEventSlide(eventId: number) {
    return baseApi.get<ApiResponse<OpentalkSlide>>(
      `${this.baseUrl}/events/${eventId}/slide`,
    );
  }

  async getSwapRequests(params?: any) {
    return baseApi.get<any>(`${this.baseUrl}/swap-requests`, { params });
  }

  async getUserSchedules(staffId: number) {
    return baseApi.get<ApiResponse<OpentalkEvent[]>>(`${this.baseUrl}/events`, {
      params: { participantId: staffId },
    });
  }

  async createSwapRequest(data: any) {
    return baseApi.post<any>(`${this.baseUrl}/swap-requests`, data);
  }

  async reviewSwapRequest(
    id: number,
    data: { approve: boolean; note?: string },
  ) {
    return baseApi.put<any>(`${this.baseUrl}/swap-requests/${id}/review`, data);
  }
}

export const opentalkClientService = new OpentalkClientService();
