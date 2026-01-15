import baseApi from '@/shared/services/client/base-api';
import { ApiResponse, IOpentalkSlide } from '@qnoffice/shared';

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

export interface IUpdateEventDto {
  title?: string;
  description?: string;
  eventDate?: string;
  status?: string;
  notes?: string;
}

class OpentalkClientService {
  private readonly baseUrl = '/opentalk';

  async updateEvent(eventId: number, data: IUpdateEventDto) {
    return baseApi.put<ApiResponse<OpentalkEvent>>(
      `${this.baseUrl}/events/${eventId}`,
      data,
    );
  }

  async updateSlide(
    eventId: number,
    data: { slideUrl?: string; presentedAt?: string },
  ) {
    return baseApi.put<ApiResponse<IOpentalkSlide>>(
      `${this.baseUrl}/events/${eventId}/slide`,
      data,
    );
  }

  async getUserSchedules(staffId: number): Promise<OpentalkEvent[]> {
    const response = await baseApi.get<ApiResponse<OpentalkEvent[]>>(
      `${this.baseUrl}/events/swap-available?participantId=${staffId}`,
    );
    return response.data.data || [];
  }

  async getSlide(eventId: number) {
    return baseApi.get<ApiResponse<IOpentalkSlide>>(
      `${this.baseUrl}/events/${eventId}/slide`,
    );
  }

  async submitSlide(payload: {
    eventId: number;
    slidesUrl: string;
    type: string;
    fileType?: string;
    fileName?: string;
  }) {
    return baseApi.post<void>(`${this.baseUrl}/slides/submit`, payload);
  }

  async approveSlide(eventId: number) {
    return baseApi.put<void>(`${this.baseUrl}/events/${eventId}/approve-slide`);
  }

  async rejectSlide(eventId: number, reason: string) {
    return baseApi.put<void>(`${this.baseUrl}/events/${eventId}/reject-slide`, {
      reason,
    });
  }

  async swapEvents(payload: { event1Id: number; event2Id: number }) {
    return baseApi.post<void>(`${this.baseUrl}/swap`, payload);
  }
}

export const opentalkClientService = new OpentalkClientService();
