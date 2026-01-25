import { cleaningClientService } from '@/shared/services/client/cleaning-client-service';
import { opentalkClientService } from '@/shared/services/client/opentalk-client-service';
import { useQuery } from '@tanstack/react-query';

export const useOpentalkUserSchedules = (staffId?: number) => {
  return useQuery({
    queryKey: ['opentalk', 'user-schedules', staffId],
    queryFn: async () => {
      if (!staffId) return [];
      // opentalkClientService.getUserSchedules returns the array directly
      return (await opentalkClientService.getUserSchedules(staffId)) || [];
    },
    enabled: !!staffId,
  });
};

export const useCleaningUserSchedules = (staffId?: number) => {
  return useQuery({
    queryKey: ['cleaning', 'user-schedules', staffId],
    queryFn: async () => {
      if (!staffId) return [];
      /**
       * cleaningClientService.getUserSchedules returns the Axios response
       * The actual array is in response.data.data
       */
      const response = await cleaningClientService.getUserSchedules(staffId);
      return response?.data?.data || [];
    },
    enabled: !!staffId,
  });
};
