import baseApi from '@/shared/services/client/base-api';
import {
  ICreateSwapRequestDto,
  IOpentalkQueryDto,
  IReviewSwapRequestDto,
  ISubmitSlideDto,
  IUpdateOpentalkEventDto,
  OpentalkEvent,
  OpentalkSlideSubmission,
  SwapRequest
} from '@qnoffice/shared';

class OpentalkClientService {
  private readonly baseUrl = '/opentalk';

  async getEvents(params: IOpentalkQueryDto = {}) {
    return baseApi.get<OpentalkEvent[]>(`${this.baseUrl}/events`, { params });
  }

  async updateEvent(eventId: number, data: IUpdateOpentalkEventDto) {
    return baseApi.put<OpentalkEvent>(
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
    return baseApi.put<OpentalkSlideSubmission>(
      `${this.baseUrl}/events/${eventId}/slide`,
      data,
    );
  }

  async getEventSlide(eventId: number) {
    return baseApi.get<OpentalkSlideSubmission>(
      `${this.baseUrl}/events/${eventId}/slide`,
    );
  }

  async getSwapRequests(params?: any) {
    return baseApi.get<SwapRequest[]>(`${this.baseUrl}/swap-requests`, { params });
  }

  async getUserSchedules(staffId: number) {
    return baseApi.get<OpentalkEvent[]>(`${this.baseUrl}/events`, {
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

export const opentalkClientService = new OpentalkClientService();
