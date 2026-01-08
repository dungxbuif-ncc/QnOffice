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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Staff } from '@qnoffice/shared';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const updateMezonIdSchema = z.object({
  mezonId: z.string().min(1, 'Please enter a Mezon ID'),
});

type UpdateMezonIdFormValues = z.infer<typeof updateMezonIdSchema>;

interface UpdateMezonIdModalProps {
  staff: Staff;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStaffUpdated?: () => void;
}

export function UpdateMezonIdModal({
  staff,
  open,
  onOpenChange,
  onStaffUpdated,
}: UpdateMezonIdModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateMezonIdFormValues>({
    resolver: zodResolver(updateMezonIdSchema),
    defaultValues: {
      mezonId: staff.userId || '',
    },
  });

  const onSubmit = async (values: UpdateMezonIdFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/staffs/${staff.id}/mezon-id`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: values.mezonId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update Mezon ID');
      }

      toast.success('Mezon ID updated successfully');
      form.reset();
      onOpenChange(false);
      onStaffUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update Mezon ID',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Mezon ID</DialogTitle>
          <DialogDescription>
            Update the Mezon ID for{' '}
            {staff.user?.name || staff.user?.email || 'this staff member'}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mezonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mezon ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Mezon ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Mezon ID
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
