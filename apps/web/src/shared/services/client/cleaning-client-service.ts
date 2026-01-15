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

class CleaningClientService {
  private readonly baseUrl = '/cleaning';

  async updateEvent(eventId: number, data: UpdateEventDto) {
    return baseApi.put<ApiResponse<CleaningEvent>>(
      `${this.baseUrl}/events/${eventId}`,
      data,
    );
  }

  async getUserSchedules(staffId: number) {
    return baseApi.get<ApiResponse<CleaningEvent[]>>(
      `${this.baseUrl}/events/swap-available`,
      {
        params: { participantId: staffId },
      },
    );
  }

  async swapParticipants(payload: {
    participant1: { eventId: number; staffId: number };
    participant2: { eventId: number; staffId: number };
  }) {
    return baseApi.post<void>(`${this.baseUrl}/swap`, payload);
  }
}

export const cleaningClientService = new CleaningClientService();
