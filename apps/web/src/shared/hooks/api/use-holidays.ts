import { holidayService } from '@/shared/services/client/holiday.service';
import {
    ICreateHolidayDto,
    ICreateHolidaysRangeDto,
    IHolidayQuery,
    IUpdateHolidayDto,
} from '@qnoffice/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const HOLIDAY_KEYS = {
  all: ['holidays'] as const,
  lists: () => [...HOLIDAY_KEYS.all, 'list'] as const,
  list: (params: IHolidayQuery) => [...HOLIDAY_KEYS.lists(), params] as const,
  details: () => [...HOLIDAY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...HOLIDAY_KEYS.details(), id] as const,
};

export function useHolidays(params: IHolidayQuery = {}) {
  return useQuery({
    queryKey: HOLIDAY_KEYS.list(params),
    queryFn: async () => {
      const response = await holidayService.getAll(params);
      return response.data;
    },
  });
}

export function useHoliday(id: number) {
  return useQuery({
    queryKey: HOLIDAY_KEYS.detail(id),
    queryFn: async () => {
      const response = await holidayService.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateHolidayDto) => holidayService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_KEYS.lists() });
    },
  });
}

export function useCreateBulkHolidays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateHolidaysRangeDto) => holidayService.createBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_KEYS.lists() });
    },
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdateHolidayDto }) =>
      holidayService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: HOLIDAY_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => holidayService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_KEYS.lists() });
    },
  });
}
