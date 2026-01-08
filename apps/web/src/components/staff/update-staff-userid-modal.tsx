'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Edit, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const updateUserIdSchema = z.object({
  userId: z.string().optional().or(z.literal('')),
});

type UpdateUserIdFormValues = z.infer<typeof updateUserIdSchema>;

interface UpdateStaffUserIdModalProps {
  staff: Staff;
  onStaffUpdated?: () => void;
  trigger?: React.ReactNode;
}

export function UpdateStaffUserIdModal({
  staff,
  onStaffUpdated,
  trigger,
}: UpdateStaffUserIdModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateUserIdFormValues>({
    resolver: zodResolver(updateUserIdSchema),
    defaultValues: {
      userId: '',
    },
  });

  const onSubmit = async (values: UpdateUserIdFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/staffs/${staff.id}/user-id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: values.userId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update staff user ID');
      }

      toast.success('Staff Mezon ID updated successfully');
      setOpen(false);
      onStaffUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update staff user ID',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Update Mezon ID
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Mezon ID</DialogTitle>
          <DialogDescription>
            Update the Mezon ID for{' '}
            {staff.user?.name || staff.user?.email || 'this staff member'}.
            Leave blank to remove the association.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mezon User ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Mezon User ID (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Current: {staff.userId || 'Not linked'}
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
