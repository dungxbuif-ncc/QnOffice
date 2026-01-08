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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateHolidayDto, CreateHolidaysRangeDto } from '@qnoffice/shared';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreateHolidayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateHolidayModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateHolidayModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'range'>('single');
  const [singleFormData, setSingleFormData] = useState<CreateHolidayDto>({
    date: '',
    name: '',
  });
  const [rangeFormData, setRangeFormData] = useState<CreateHolidaysRangeDto>({
    startDate: '',
    endDate: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint =
        mode === 'single' ? '/api/holidays' : '/api/holidays/bulk';
      const body = mode === 'single' ? singleFormData : rangeFormData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create holiday');
      }

      const successMessage =
        mode === 'single'
          ? 'Holiday created successfully'
          : 'Holidays created successfully';
      toast.success(successMessage);

      setSingleFormData({ date: '', name: '' });
      setRangeFormData({ startDate: '', endDate: '', name: '' });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create holiday',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Add New Holiday</DialogTitle>
          <DialogDescription>
            Create a single holiday or multiple holidays by date range.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as 'single' | 'range')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Date</TabsTrigger>
              <TabsTrigger value="range">Date Range</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="single-date">Date</Label>
                <Input
                  id="single-date"
                  type="date"
                  min={getTodayString()}
                  value={singleFormData.date}
                  onChange={(e) =>
                    setSingleFormData({
                      ...singleFormData,
                      date: e.target.value,
                    })
                  }
                  required={mode === 'single'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="single-name">Holiday Name</Label>
                <Input
                  id="single-name"
                  placeholder="e.g., New Year's Day"
                  value={singleFormData.name}
                  onChange={(e) =>
                    setSingleFormData({
                      ...singleFormData,
                      name: e.target.value,
                    })
                  }
                  required={mode === 'single'}
                />
              </div>
            </TabsContent>

            <TabsContent value="range" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  min={getTodayString()}
                  value={rangeFormData.startDate}
                  onChange={(e) =>
                    setRangeFormData({
                      ...rangeFormData,
                      startDate: e.target.value,
                    })
                  }
                  required={mode === 'range'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  min={rangeFormData.startDate || getTodayString()}
                  value={rangeFormData.endDate}
                  onChange={(e) =>
                    setRangeFormData({
                      ...rangeFormData,
                      endDate: e.target.value,
                    })
                  }
                  required={mode === 'range'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="range-name">Holiday Name</Label>
                <Input
                  id="range-name"
                  placeholder="e.g., Spring Break"
                  value={rangeFormData.name}
                  onChange={(e) =>
                    setRangeFormData({ ...rangeFormData, name: e.target.value })
                  }
                  required={mode === 'range'}
                />
                <p className="text-xs text-muted-foreground">
                  This name will be applied to all dates in the range
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Creating...'
                : mode === 'single'
                  ? 'Create Holiday'
                  : 'Create Holidays'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
