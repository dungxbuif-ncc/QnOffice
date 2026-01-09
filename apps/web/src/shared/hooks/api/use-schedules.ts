import { scheduleClientService } from '@/shared/services/client/schedule-client-service';
import {
    EventStatus,
    ICreateCycleDto,
    ScheduleType,
} from '@qnoffice/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const SCHEDULE_KEYS = {
  all: ['schedules'] as const,
  assignments: () => [...SCHEDULE_KEYS.all, 'assignments'] as const,
  assignmentList: (query: { type?: ScheduleType; status?: EventStatus }) =>
    [...SCHEDULE_KEYS.assignments(), query] as const,
};

export function useAssignments(query: { type?: ScheduleType; status?: EventStatus }) {
  return useQuery({
    queryKey: SCHEDULE_KEYS.assignmentList(query),
    queryFn: () => scheduleClientService.getAssignments(query),
  });
}

export function useCreateScheduleCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateCycleDto) => scheduleClientService.createCycle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.assignments() });
    },
  });
}

export function useManualSwap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ event1Id, event2Id }: { event1Id: number; event2Id: number }) =>
      scheduleClientService.manualSwap(event1Id, event2Id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.assignments() });
    },
  });
}
