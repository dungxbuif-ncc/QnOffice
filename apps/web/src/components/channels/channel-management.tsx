'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { channelConfigClientService } from '@/shared/services/client/channel-config-client-service';
import { MEZON_CHANNELS, MezonChannelType } from '@qnoffice/shared';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function ChannelManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [channelIds, setChannelIds] = useState<
    Record<MezonChannelType, string>
  >({
    CLEANING: '',
    OPENTALK: '',
    PUNISHMENT: '',
  });

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const response = await channelConfigClientService.getAllConfigs();
      console.log('Loaded channel configs:', response);
      const configs = response.data || [];
      const newChannelIds: Record<MezonChannelType, string> = {
        CLEANING: '',
        OPENTALK: '',
        PUNISHMENT: '',
      };
      configs.forEach((config) => {
        newChannelIds[config.channelType] = config.channelId;
      });
      setChannelIds(newChannelIds);
    } catch (error) {
      toast.error('Failed to load channel configurations');
    }
  };

  const handleChannelIdChange = (
    channelType: MezonChannelType,
    value: string,
  ) => {
    setChannelIds((prev) => ({
      ...prev,
      [channelType]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const promises = Object.entries(channelIds)
        .filter(([_, id]) => id.trim())
        .map(([channelType, channelId]) =>
          channelConfigClientService.configureChannel({
            channelType: channelType as MezonChannelType,
            channelId,
            isActive: true,
          }),
        );

      await Promise.all(promises);
      toast.success('Channel configurations saved successfully');
      loadChannels();
    } catch (error) {
      toast.error('Failed to save channel configurations');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Channel Management
        </h2>
        <p className="text-muted-foreground">
          Configure Mezon channel IDs for notifications
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border p-6 space-y-4">
          {Object.keys(MEZON_CHANNELS).map((key) => (
            <div key={key} className="grid gap-2">
              <Label htmlFor={`channel-${key}`}>
                {MEZON_CHANNELS[key as MezonChannelType]}
              </Label>
              <Input
                id={`channel-${key}`}
                type="text"
                placeholder="Enter channel ID"
                value={channelIds[key as MezonChannelType]}
                onChange={(e) =>
                  handleChannelIdChange(key as MezonChannelType, e.target.value)
                }
              />
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Submit'}
        </Button>
      </form>
    </div>
  );
}
