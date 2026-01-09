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

export interface IUpdateEventDto {
  title?: string;
  description?: string;
  eventDate?: string;
  status?: string;
  notes?: string;
}

export interface ISwapEventsDto {
  eventId1: number;
  eventId2: number;
}

class OpentalkClientService {
  private readonly baseUrl = '/opentalk';

  async updateEvent(eventId: number, data: IUpdateEventDto) {
    return baseApi.put<ApiResponse<OpentalkEvent>>(
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

  async updateSlide(
    eventId: number,
    data: { slideUrl?: string; presentedAt?: string },
  ) {
    return baseApi.put<ApiResponse<OpentalkSlide>>(
      `${this.baseUrl}/events/${eventId}/slide`,
      data,
    );
  }

  async getSwapRequests(params?: any) {
    return baseApi.get<any>(`${this.baseUrl}/swap-requests`, { params });
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
