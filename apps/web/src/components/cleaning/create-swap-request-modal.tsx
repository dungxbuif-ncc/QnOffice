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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ICreateSwapRequestDto } from '@qnoffice/shared';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CreateSwapRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: number;
  onSuccess?: () => void;
}

export function CreateSwapRequestModal({
  open,
  onOpenChange,
  scheduleId,
  onSuccess,
}: CreateSwapRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [formData, setFormData] = useState<ICreateSwapRequestDto>({
    scheduleId,
    targetStaffId: undefined,
    reason: '',
  });

  useEffect(() => {
    if (open) {
      fetchStaff();
    }
  }, [open]);

  const fetchStaff = async () => {
    try {
      // Get staff from the same cycle as the selected schedule
      const response = await fetch(
        `/api/opentalk/schedules/${scheduleId}/available-swaps`,
      );
      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      }
    } catch (error) {
      console.error('Error fetching available staff for swap:', error);
      toast.error('Failed to load available staff for swap');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/opentalk/swap-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create swap request');
      }

      toast.success('Swap request created successfully');
      setFormData({ scheduleId, targetStaffId: undefined, reason: '' });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create swap request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Schedule Swap</DialogTitle>
          <DialogDescription>
            Request to swap your OpenTalk schedule with another staff member
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetStaff">
                Swap with Staff (Optional - Leave empty to swap with next
                available in cycle)
              </Label>
              <Select
                value={formData.targetStaffId?.toString() || 'none'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    targetStaffId:
                      value === 'none' ? undefined : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member in same cycle (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    None (Auto-assign from cycle)
                  </SelectItem>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.user?.name || staff.email}
                      {staff.scheduleDate && (
                        <span className="text-muted-foreground ml-2">
                          ({new Date(staff.scheduleDate).toLocaleDateString()})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Explain why you need to swap your schedule within this cycle..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
