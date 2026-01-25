'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    useChannelConfigs,
    useConfigureChannels,
} from '@/shared/hooks/use-channel-configs';
import { MEZON_CHANNELS, MezonChannelType } from '@qnoffice/shared';
import { useEffect, useState } from 'react';

export function ChannelManagement() {
  const { data: configs } = useChannelConfigs();
  const { mutate: configureChannels, isPending: isSaving } =
    useConfigureChannels();

  const [channelIds, setChannelIds] = useState<
    Record<MezonChannelType, string>
  >({
    CLEANING: '',
    OPENTALK: '',
    PUNISHMENT: '',
  });

  useEffect(() => {
    if (configs) {
      const newChannelIds: Record<MezonChannelType, string> = {
        CLEANING: '',
        OPENTALK: '',
        PUNISHMENT: '',
      };

      configs.forEach((config) => {
        newChannelIds[config.channelType] = config.channelId;
      });

      setChannelIds((prev) => ({
        ...prev,
        ...newChannelIds,
      }));
    }
  }, [configs]);

  const handleChannelIdChange = (
    channelType: MezonChannelType,
    value: string,
  ) => {
    setChannelIds((prev) => ({
      ...prev,
      [channelType]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    configureChannels(channelIds);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quản lý kênh</h2>
        <p className="text-muted-foreground">
          Thiết lập ID kênh Mezon để nhận thông báo
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
                placeholder="Nhập ID kênh"
                value={channelIds[key as MezonChannelType]}
                onChange={(e) =>
                  handleChannelIdChange(key as MezonChannelType, e.target.value)
                }
              />
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </form>
    </div>
  );
}
