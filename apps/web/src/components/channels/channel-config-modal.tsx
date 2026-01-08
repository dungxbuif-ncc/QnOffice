'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  ChannelConfig,
  ChannelConfigClientService,
  ConfigureChannelDto,
} from '@/shared/services/client/channel-config-client-service';
import { MEZON_CHANNELS, MezonChannelType } from '@qnoffice/shared';
import { useState } from 'react';
import { toast } from 'sonner';

interface ChannelConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  config?: ChannelConfig;
}

export function ChannelConfigModal({
  open,
  onOpenChange,
  onSuccess,
  config,
}: ChannelConfigModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ConfigureChannelDto>({
    channelType: config?.channelType || 'CLEANING',
    channelId: config?.channelId || '',
    channelName: config?.channelName || '',
    description: config?.description || '',
    isActive: config?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const service = new ChannelConfigClientService();

      if (config) {
        await service.updateConfig(config.channelType, {
          channelId: formData.channelId,
          channelName: formData.channelName,
          description: formData.description,
          isActive: formData.isActive,
        });
        toast.success('Channel configuration updated successfully');
      } else {
        await service.configureChannel(formData);
        toast.success('Channel configuration created successfully');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save channel configuration',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {config
              ? 'Edit Channel Configuration'
              : 'Add Channel Configuration'}
          </DialogTitle>
          <DialogDescription>
            Configure Mezon channel ID for notifications
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="channelType">Channel Type</Label>
              <select
                id="channelType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.channelType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    channelType: e.target.value as MezonChannelType,
                  })
                }
                disabled={!!config}
                required
              >
                {Object.entries(MEZON_CHANNELS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="channelId">Channel ID *</Label>
              <Input
                id="channelId"
                type="text"
                placeholder="1234567890"
                value={formData.channelId}
                onChange={(e) =>
                  setFormData({ ...formData, channelId: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="channelName">Channel Name</Label>
              <Input
                id="channelName"
                type="text"
                placeholder="Cleaning Discussion"
                value={formData.channelName}
                onChange={(e) =>
                  setFormData({ ...formData, channelName: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Channel description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : config ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
