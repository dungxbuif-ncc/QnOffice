import { channelConfigClientService } from '@/shared/services/client/channel-config-client-service';
import { MezonChannelType } from '@qnoffice/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const CHANNEL_CONFIGS_KEY = ['channel-configs'];

export const useChannelConfigs = () => {
  return useQuery({
    queryKey: CHANNEL_CONFIGS_KEY,
    queryFn: async () => {
      const response = await channelConfigClientService.getAllConfigs();
      return response.data || [];
    },
  });
};

export const useConfigureChannels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channels: Record<MezonChannelType, string>) => {
      const promises = Object.entries(channels)
        .filter(([, id]) => id.trim())
        .map(([channelType, channelId]) =>
          channelConfigClientService.configureChannel({
            channelType: channelType as MezonChannelType,
            channelId,
            isActive: true,
          }),
        );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_CONFIGS_KEY });
      toast.success('Lưu cấu hình kênh thành công');
    },
    onError: () => {
      toast.error('Lưu cấu hình kênh thất bại');
    },
  });
};
