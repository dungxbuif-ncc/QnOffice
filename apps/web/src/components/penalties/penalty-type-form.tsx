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
import { Textarea } from '@/components/ui/textarea';
import penaltyTypeService from '@/shared/services/client/penalty-type.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePenaltyTypeDto, PenaltyType } from '@qnoffice/shared';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
});

interface PenaltyTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  penaltyType?: PenaltyType;
}

export function PenaltyTypeForm({
  isOpen,
  onClose,
  onSuccess,
  penaltyType,
}: PenaltyTypeFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: penaltyType?.name || '',
      description: penaltyType?.description || '',
      amount: penaltyType?.amount || 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (penaltyType) {
        await penaltyTypeService.update(penaltyType.id, values);
        toast.success('Penalty type updated successfully');
      } else {
        await penaltyTypeService.create(values as CreatePenaltyTypeDto);
        toast.success('Penalty type created successfully');
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(
        penaltyType
          ? 'Failed to update penalty type'
          : 'Failed to create penalty type',
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {penaltyType ? 'Edit' : 'Create'} Penalty Type
          </DialogTitle>
          <DialogDescription>
            {penaltyType ? 'Update the' : 'Add a new'} penalty type with default
            amount
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Late to Work" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the violation..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Amount (VND)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{penaltyType ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
