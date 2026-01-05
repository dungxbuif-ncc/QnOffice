import { CreateBranchDto, UpdateBranchDto } from '@/types/branch';

import { branchService } from '@/lib/services/branch-service';
import { PaginationOptions } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const BRANCH_KEYS = {
  all: ['branches'] as const,
  lists: () => [...BRANCH_KEYS.all, 'list'] as const,
  list: (options: PaginationOptions) =>
    [...BRANCH_KEYS.lists(), options] as const,
  details: () => [...BRANCH_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BRANCH_KEYS.details(), id] as const,
};

export function useBranches(options: PaginationOptions = {}) {
  return useQuery({
    queryKey: BRANCH_KEYS.list(options),
    queryFn: () => branchService.getAll(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: BRANCH_KEYS.detail(id),
    queryFn: () => branchService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBranchDto) => branchService.create(data),
    onSuccess: () => {
      // Invalidate and refetch branches list
      queryClient.invalidateQueries({ queryKey: BRANCH_KEYS.lists() });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchDto }) =>
      branchService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific branch and list
      queryClient.invalidateQueries({
        queryKey: BRANCH_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: BRANCH_KEYS.lists() });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => branchService.remove(id),
    onSuccess: () => {
      // Invalidate branches list
      queryClient.invalidateQueries({ queryKey: BRANCH_KEYS.lists() });
    },
  });
}
