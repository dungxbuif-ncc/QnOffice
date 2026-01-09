import baseApi from '@/shared/services/client/base-api';
import {
    OpentalkEvent as CleaningEvent,
    OpentalkSlideSubmission as CleaningSlide,
    ICreateSwapRequestDto,
    IOpentalkQueryDto,
    IReviewSwapRequestDto,
    ISubmitSlideDto,
    IUpdateOpentalkEventDto,
    SwapRequest
} from '@qnoffice/shared';

class CleaningClientService {
  private readonly baseUrl = '/cleaning';

  async getEvents(params: IOpentalkQueryDto = {}) {
    return baseApi.get<CleaningEvent[]>(`${this.baseUrl}/events`, { params });
  }

  async updateEvent(eventId: number, data: IUpdateOpentalkEventDto) {
    return baseApi.put<CleaningEvent>(
      `${this.baseUrl}/events/${eventId}`,
      data,
    );
  }

  async swapEvents(event1Id: number, event2Id: number) {
    return baseApi.post<void>(`${this.baseUrl}/swap`, {
      event1Id,
      event2Id,
    });
  }

  async updateSlide(
    eventId: number,
    data: ISubmitSlideDto
  ) {
    return baseApi.put<CleaningSlide>(
      `${this.baseUrl}/events/${eventId}/slide`,
      data,
    );
  }

  async getEventSlide(eventId: number) {
    return baseApi.get<CleaningSlide>(
      `${this.baseUrl}/events/${eventId}/slide`,
    );
  }

  async getSwapRequests(params?: any) {
    return baseApi.get<SwapRequest[]>(`${this.baseUrl}/swap-requests`, { params });
  }

  async getUserSchedules(staffId: number) {
    return baseApi.get<CleaningEvent[]>(`${this.baseUrl}/events`, {
      params: { participantId: staffId },
    });
  }

  async createSwapRequest(data: ICreateSwapRequestDto) {
    return baseApi.post<SwapRequest>(`${this.baseUrl}/swap-requests`, data);
  }

  async reviewSwapRequest(
    id: number,
    data: IReviewSwapRequestDto
  ) {
    return baseApi.put<SwapRequest>(`${this.baseUrl}/swap-requests/${id}/review`, data);
  }
}

export const cleaningClientService = new CleaningClientService();
