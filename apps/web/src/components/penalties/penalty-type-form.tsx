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
import { ICreatePenaltyTypeDto, PenaltyType } from '@qnoffice/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Tên là bắt buộc'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Số tiền phải lớn hơn 0'),
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

  useEffect(() => {
    if (penaltyType) {
      form.reset({
        name: penaltyType.name ?? '',
        description: penaltyType.description ?? '',
        amount: Number(penaltyType.amount) || 0,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        amount: 0,
      });
    }
  }, [penaltyType, isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (penaltyType) {
        await penaltyTypeService.update(penaltyType.id, values);
        toast.success('Cập nhật loại phạt thành công');
      } else {
        await penaltyTypeService.create(values as ICreatePenaltyTypeDto);
        toast.success('Tạo loại phạt thành công');
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(
        penaltyType ? 'Cập nhật loại phạt thất bại' : 'Tạo loại phạt thất bại',
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {penaltyType ? 'Chỉnh sửa' : 'Tạo mới'} loại phạt
          </DialogTitle>
          <DialogDescription>
            {penaltyType ? 'Cập nhật' : 'Thêm mới'} loại phạt với mức phạt mặc
            định
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Đi làm muộn" {...field} />
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
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Mô tả vi phạm..." {...field} />
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
                  <FormLabel>Mức phạt mặc định (VND)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit">
                {penaltyType ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
