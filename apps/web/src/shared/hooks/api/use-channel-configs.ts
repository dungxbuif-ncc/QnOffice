import { channelConfigClientService } from '@/shared/services/client/channel-config-client-service';
import {
   IConfigureChannelDto,
   IUpdateChannelConfigDto,
   MezonChannelType,
} from '@qnoffice/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const CHANNEL_CONFIG_KEYS = {
  all: ['channel-configs'] as const,
  lists: () => [...CHANNEL_CONFIG_KEYS.all, 'list'] as const,
  active: () => [...CHANNEL_CONFIG_KEYS.all, 'active'] as const,
  details: () => [...CHANNEL_CONFIG_KEYS.all, 'detail'] as const,
  detail: (type: MezonChannelType) =>
    [...CHANNEL_CONFIG_KEYS.details(), type] as const,
};

export function useChannelConfigs() {
  return useQuery({
    queryKey: CHANNEL_CONFIG_KEYS.lists(),
    queryFn: () => channelConfigClientService.getAllConfigs(),
  });
}

export function useActiveChannels() {
  return useQuery({
    queryKey: CHANNEL_CONFIG_KEYS.active(),
    queryFn: () => channelConfigClientService.getActiveChannels(),
  });
}

export function useChannelConfig(type: MezonChannelType) {
  return useQuery({
    queryKey: CHANNEL_CONFIG_KEYS.detail(type),
    queryFn: () => channelConfigClientService.getConfig(type),
    enabled: !!type,
  });
}

export function useConfigureChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IConfigureChannelDto) =>
      channelConfigClientService.configureChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_CONFIG_KEYS.all });
    },
  });
}

export function useUpdateChannelConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      data,
    }: {
      type: MezonChannelType;
      data: IUpdateChannelConfigDto;
    }) => channelConfigClientService.updateConfig(type, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_CONFIG_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: CHANNEL_CONFIG_KEYS.detail(variables.type),
      });
    },
  });
}

export function useDeleteChannelConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (type: MezonChannelType) =>
      channelConfigClientService.deleteConfig(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_CONFIG_KEYS.all });
    },
  });
}
