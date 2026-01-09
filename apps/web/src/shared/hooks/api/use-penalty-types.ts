import penaltyTypeService from '@/shared/services/client/penalty-type.service';
import {
    ICreatePenaltyTypeDto,
    IPaginateOptionsDto,
    IUpdatePenaltyTypeDto,
} from '@qnoffice/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const PENALTY_TYPE_KEYS = {
  all: ['penalty-types'] as const,
  lists: () => [...PENALTY_TYPE_KEYS.all, 'list'] as const,
  list: (params: Partial<IPaginateOptionsDto>) =>
    [...PENALTY_TYPE_KEYS.lists(), params] as const,
  details: () => [...PENALTY_TYPE_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PENALTY_TYPE_KEYS.details(), id] as const,
};

export function usePenaltyTypes(params: Partial<IPaginateOptionsDto> = {}) {
  return useQuery({
    queryKey: PENALTY_TYPE_KEYS.list(params),
    queryFn: async () => {
      const response = await penaltyTypeService.findAll(params);
      return response.data;
    },
  });
}

export function usePenaltyType(id: number) {
  return useQuery({
    queryKey: PENALTY_TYPE_KEYS.detail(id),
    queryFn: async () => {
      const response = await penaltyTypeService.findOne(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePenaltyType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreatePenaltyTypeDto) => penaltyTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENALTY_TYPE_KEYS.lists() });
    },
  });
}

export function useUpdatePenaltyType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdatePenaltyTypeDto }) =>
      penaltyTypeService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PENALTY_TYPE_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: PENALTY_TYPE_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeletePenaltyType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => penaltyTypeService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENALTY_TYPE_KEYS.lists() });
    },
  });
}
