import penaltyService from '@/shared/services/client/penalty.service';
import {
    ICreatePenaltyDto,
    IPaginateOptionsDto,
    IUpdatePenaltyDto,
    IUpdatePenaltyEvidenceDto,
} from '@qnoffice/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const PENALTY_KEYS = {
  all: ['penalties'] as const,
  lists: () => [...PENALTY_KEYS.all, 'list'] as const,
  list: (params: Partial<IPaginateOptionsDto>) =>
    [...PENALTY_KEYS.lists(), params] as const,
  details: () => [...PENALTY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PENALTY_KEYS.details(), id] as const,
};

export function usePenalties(params: Partial<IPaginateOptionsDto> = {}) {
  return useQuery({
    queryKey: PENALTY_KEYS.list(params),
    queryFn: async () => {
      const response = await penaltyService.findAll(params);
      return response.data;
    },
  });
}

export function usePenalty(id: number) {
  return useQuery({
    queryKey: PENALTY_KEYS.detail(id),
    queryFn: async () => {
      const response = await penaltyService.findOne(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreatePenaltyDto) => penaltyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENALTY_KEYS.lists() });
    },
  });
}

export function useUpdatePenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdatePenaltyDto }) =>
      penaltyService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PENALTY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: PENALTY_KEYS.detail(variables.id),
      });
    },
  });
}

export function useUpdatePenaltyEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IUpdatePenaltyEvidenceDto }) =>
      penaltyService.updateEvidence(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PENALTY_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeletePenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => penaltyService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENALTY_KEYS.lists() });
    },
  });
}
