import staffService from '@/shared/services/client/staff.service';
import {
    ICreateStaffDto,
    IPaginateOptionsDto,
    IUpdateStaffUserIdDto,
} from '@qnoffice/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const STAFF_KEYS = {
  all: ['staff'] as const,
  lists: () => [...STAFF_KEYS.all, 'list'] as const,
  list: (params: Partial<IPaginateOptionsDto>) =>
    [...STAFF_KEYS.lists(), params] as const,
  active: () => [...STAFF_KEYS.all, 'active'] as const,
  details: () => [...STAFF_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...STAFF_KEYS.details(), id] as const,
  byUserId: (userId: string) => [...STAFF_KEYS.all, 'byUserId', userId] as const,
};

export function useStaffs(params: Partial<IPaginateOptionsDto> = {}) {
  return useQuery({
    queryKey: STAFF_KEYS.list(params),
    queryFn: async () => {
      const response = await staffService.getStaffs(params);
      return response.data;
    },
  });
}

export function useActiveStaffs() {
  return useQuery({
    queryKey: STAFF_KEYS.active(),
    queryFn: async () => {
      const response = await staffService.getAllActive();
      return response.data;
    },
  });
}

export function useStaff(id: number) {
  return useQuery({
    queryKey: STAFF_KEYS.detail(id),
    queryFn: async () => {
      const response = await staffService.findById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useStaffByUserId(userId: string) {
  return useQuery({
    queryKey: STAFF_KEYS.byUserId(userId),
    queryFn: async () => {
      const response = await staffService.findByUserId(userId);
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateStaffDto) => staffService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.active() });
    },
  });
}

export function useUpdateStaffMezonId() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdateStaffUserIdDto }) =>
      staffService.updateMezonId(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.active() });
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.detail(variables.id) });
    },
  });
}
