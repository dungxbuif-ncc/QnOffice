import { cleaningClientService } from '@/shared/services/client/cleaning-client-service';
import {
    ICreateSwapRequestDto,
    IOpentalkQueryDto,
    IReviewSwapRequestDto,
    ISubmitSlideDto,
    IUpdateOpentalkEventDto
} from '@qnoffice/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const CLEANING_KEYS = {
  all: ['cleaning'] as const,
  events: () => [...CLEANING_KEYS.all, 'events'] as const,
  eventList: (params: IOpentalkQueryDto) => [...CLEANING_KEYS.events(), params] as const,
  slides: () => [...CLEANING_KEYS.all, 'slides'] as const,
  slide: (eventId: number) => [...CLEANING_KEYS.slides(), eventId] as const,
  swapRequests: () => [...CLEANING_KEYS.all, 'swap-requests'] as const,
  swapRequestList: (params: any) => [...CLEANING_KEYS.swapRequests(), params] as const,
  userSchedules: (staffId: number) => [...CLEANING_KEYS.all, 'user-schedules', staffId] as const,
};

export function useCleaningEvents(params: IOpentalkQueryDto = {}) {
  return useQuery({
    queryKey: CLEANING_KEYS.eventList(params),
    queryFn: async () => {
      const response = await cleaningClientService.getEvents(params);
      return response.data;
    },
  });
}

export function useCleaningSlide(eventId: number) {
  return useQuery({
    queryKey: CLEANING_KEYS.slide(eventId),
    queryFn: async () => {
      const response = await cleaningClientService.getEventSlide(eventId);
      return response.data;
    },
    enabled: !!eventId,
  });
}

export function useCleaningSwapRequests(params: any = {}) {
  return useQuery({
    queryKey: CLEANING_KEYS.swapRequestList(params),
    queryFn: async () => {
      const response = await cleaningClientService.getSwapRequests(params);
      return response.data;
    },
  });
}

export function useUserCleaningSchedules(staffId: number) {
  return useQuery({
    queryKey: CLEANING_KEYS.userSchedules(staffId),
    queryFn: async () => {
      const response = await cleaningClientService.getUserSchedules(staffId);
      return response.data;
    },
    enabled: !!staffId,
  });
}

export function useUpdateCleaningEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: IUpdateOpentalkEventDto }) =>
      cleaningClientService.updateEvent(eventId, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLEANING_KEYS.events() });
    },
  });
}

export function useSwapCleaningEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ event1Id, event2Id }: { event1Id: number; event2Id: number }) =>
      cleaningClientService.swapEvents(event1Id, event2Id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLEANING_KEYS.events() });
    },
  });
}

export function useSubmitCleaningSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: ISubmitSlideDto }) =>
      cleaningClientService.updateSlide(eventId, data as any),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CLEANING_KEYS.slide(variables.eventId) });
    },
  });
}

export function useCreateCleaningSwapRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateSwapRequestDto) =>
      cleaningClientService.createSwapRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLEANING_KEYS.swapRequests() });
    },
  });
}

export function useReviewCleaningSwapRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IReviewSwapRequestDto }) =>
      cleaningClientService.reviewSwapRequest(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLEANING_KEYS.swapRequests() });
      queryClient.invalidateQueries({ queryKey: CLEANING_KEYS.events() });
    },
  });
}
