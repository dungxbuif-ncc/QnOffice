import { opentalkClientService } from '@/shared/services/client/opentalk-client-service';
import {
    ICreateSwapRequestDto,
    IOpentalkQueryDto,
    IReviewSwapRequestDto,
    ISubmitSlideDto,
    IUpdateOpentalkEventDto
} from '@qnoffice/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const OPENTALK_KEYS = {
  all: ['opentalk'] as const,
  events: () => [...OPENTALK_KEYS.all, 'events'] as const,
  eventList: (params: IOpentalkQueryDto) => [...OPENTALK_KEYS.events(), params] as const,
  slides: () => [...OPENTALK_KEYS.all, 'slides'] as const,
  slide: (eventId: number) => [...OPENTALK_KEYS.slides(), eventId] as const,
  swapRequests: () => [...OPENTALK_KEYS.all, 'swap-requests'] as const,
  swapRequestList: (params: any) => [...OPENTALK_KEYS.swapRequests(), params] as const,
  userSchedules: (staffId: number) => [...OPENTALK_KEYS.all, 'user-schedules', staffId] as const,
};

export function useOpentalkEvents(params: IOpentalkQueryDto = {}) {
  return useQuery({
    queryKey: OPENTALK_KEYS.eventList(params),
    queryFn: async () => {
      const response = await opentalkClientService.getEvents(params);
      return response.data;
    },
  });
}

export function useOpentalkSlide(eventId: number) {
  return useQuery({
    queryKey: OPENTALK_KEYS.slide(eventId),
    queryFn: async () => {
      const response = await opentalkClientService.getEventSlide(eventId);
      return response.data;
    },
    enabled: !!eventId,
  });
}

export function useOpentalkSwapRequests(params: any = {}) {
  return useQuery({
    queryKey: OPENTALK_KEYS.swapRequestList(params),
    queryFn: async () => {
      const response = await opentalkClientService.getSwapRequests(params);
      return response.data;
    },
  });
}

export function useUserOpentalkSchedules(staffId: number) {
  return useQuery({
    queryKey: OPENTALK_KEYS.userSchedules(staffId),
    queryFn: async () => {
      const response = await opentalkClientService.getUserSchedules(staffId);
      return response.data;
    },
    enabled: !!staffId,
  });
}

export function useUpdateOpentalkEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: IUpdateOpentalkEventDto }) =>
      opentalkClientService.updateEvent(eventId, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPENTALK_KEYS.events() });
    },
  });
}

export function useSwapOpentalkEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ event1Id, event2Id }: { event1Id: number; event2Id: number }) =>
      opentalkClientService.swapEvents(event1Id, event2Id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPENTALK_KEYS.events() });
    },
  });
}

export function useSubmitOpentalkSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: ISubmitSlideDto }) =>
      opentalkClientService.updateSlide(eventId, data as any),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: OPENTALK_KEYS.slide(variables.eventId) });
    },
  });
}

export function useCreateOpentalkSwapRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateSwapRequestDto) =>
      opentalkClientService.createSwapRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPENTALK_KEYS.swapRequests() });
    },
  });
}

export function useReviewOpentalkSwapRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IReviewSwapRequestDto }) =>
      opentalkClientService.reviewSwapRequest(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPENTALK_KEYS.swapRequests() });
      queryClient.invalidateQueries({ queryKey: OPENTALK_KEYS.events() });
    },
  });
}
