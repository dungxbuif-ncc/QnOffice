'use client';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useDebouncedValue } from '@/shared/hooks/use-debounce-value';
import penaltyTypeService from '@/shared/services/client/penalty-type.service';
import penaltyService from '@/shared/services/client/penalty.service';
import staffService from '@/shared/services/client/staff.service';
import { cn } from '@/shared/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ApiResponse,
  ICreatePenaltyDto,
  PenaltyType,
  Staff,
} from '@qnoffice/shared';
import { Check, ChevronsUpDown, ImagePlus, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  staffId: z.number().min(1, 'Nhân viên là bắt buộc'),
  penaltyTypeId: z.number().min(1, 'Loại phạt là bắt buộc'),
  date: z.string().min(1, 'Ngày là bắt buộc'),
  amount: z.number().optional(),
  reason: z.string().min(1, 'Lý do là bắt buộc'),
  evidenceUrls: z.array(z.string()).optional(),
});

interface CreatePenaltyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePenaltyForm({
  isOpen,
  onClose,
  onSuccess,
}: CreatePenaltyFormProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [penaltyTypes, setPenaltyTypes] = useState<PenaltyType[]>([]);
  const [selectedType, setSelectedType] = useState<PenaltyType | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [staffPage, setStaffPage] = useState(1);
  const [staffTotal, setStaffTotal] = useState(0);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);

  const [typePage, setTypePage] = useState(1);
  const [typeTotal, setTypeTotal] = useState(0);
  const [typeLoading, setTypeLoading] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const staffListRef = useRef<HTMLDivElement>(null);
  const typeListRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const searchDebounced = useDebouncedValue(search, 1000);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      staffId: 0,
      penaltyTypeId: 0,
      date: new Date().toISOString().split('T')[0],
      reason: '',
      evidenceUrls: [],
    },
  });

  const loadStaff = async (page: number, append = false) => {
    if (staffLoading) return;
    try {
      setStaffLoading(true);
      const response = await staffService.getStaffs({ page, take: 20 });
      const data = response.data.data;
      setStaffList((prev) =>
        append ? [...prev, ...data.result] : data.result,
      );
      setStaffTotal(data.total);
    } catch {
      toast.error('Không thể tải danh sách nhân viên');
    } finally {
      setStaffLoading(false);
    }
  };

  const loadPenaltyTypes = async (page: number, append = false) => {
    if (typeLoading) return;
    try {
      setTypeLoading(true);
      const response = await penaltyTypeService.findAll();
      const types = response.data.data.result;
      setPenaltyTypes(types);
      setTypeTotal(response.data.data.total);
    } catch (error) {
      toast.error('Không thể tải loại phạt');
    } finally {
      setTypeLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStaff(1);
      loadPenaltyTypes(1);
    }
  }, [isOpen]);

  const handleStaffScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50;

    if (bottom && !staffLoading && staffList.length < staffTotal) {
      const nextPage = staffPage + 1;
      setStaffPage(nextPage);
      loadStaff(nextPage, true);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsUploading(true);
      let uploadedUrls: string[] = [];

      if (evidenceFiles.length > 0) {
        const response = await fetch('/api/upload/presigned-urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: evidenceFiles.map((file) => ({
              fileName: file.name,
              contentType: file.type,
            })),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Upload error:', error);
          throw new Error('Failed to get upload URLs');
        }

        const apiResponse: ApiResponse<
          Array<{ uploadUrl: string; fileUrl: string }>
        > = await response.json();
        const presignedUrls = apiResponse.data;

        await Promise.all(
          presignedUrls.map(async (urlData, index: number) => {
            const file = evidenceFiles[index];
            try {
              const uploadResponse = await fetch(urlData.uploadUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': file.type,
                },
                body: file,
              });

              if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('Upload failed:', {
                  status: uploadResponse.status,
                  statusText: uploadResponse.statusText,
                  error: errorText,
                  url: urlData.uploadUrl,
                });
                throw new Error(
                  `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
                );
              }
            } catch (error) {
              console.error('Upload error for file:', file.name, error);
              throw error;
            }
          }),
        );

        uploadedUrls = presignedUrls.map((urlData) => urlData.fileUrl);
      }

      const payload: ICreatePenaltyDto = {
        ...values,
        amount: values.amount || selectedType?.amount,
        evidenceUrls: uploadedUrls,
      };

      await penaltyService.create(payload);
      toast.success('Tạo phạt thành công');
      onSuccess();
      onClose();
      form.reset();
      setEvidenceFiles([]);
    } catch (error) {
      toast.error('Tạo phạt thất bại');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTypeChange = (typeId: string) => {
    const type = penaltyTypes.find((t) => t.id === Number(typeId));
    setSelectedType(type || null);
    if (type) {
      form.setValue('amount', Number(type.amount));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      toast.error('Chỉ cho phép tải lên file ảnh');
    }

    setEvidenceFiles((prev) => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetAllChange = () => {
    form.reset();
    form.setValue('amount', 0);
    setEvidenceFiles([]);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          resetAllChange();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo phạt</DialogTitle>
          <DialogDescription>
            Tạo bản ghi phạt mới cho nhân viên
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="staffId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Nhân viên</FormLabel>
                  <Popover open={staffOpen} onOpenChange={setStaffOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? staffList.find(
                                (staff) => staff.id === field.value,
                              )?.user?.email ||
                              staffList.find(
                                (staff) => staff.id === field.value,
                              )?.email
                            : 'Chọn nhân viên'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Tìm kiếm nhân viên..."
                          value={search}
                          onValueChange={setSearch}
                        />
                        <CommandList
                          onScroll={handleStaffScroll}
                          ref={staffListRef}
                          className="max-h-[300px] overflow-y-auto"
                        >
                          <CommandEmpty>Không tìm thấy nhân viên.</CommandEmpty>
                          <CommandGroup>
                            {staffList.map((staff) => (
                              <CommandItem
                                value={staff.user?.email || staff.email}
                                key={staff.id}
                                onSelect={() => {
                                  form.setValue('staffId', staff.id);
                                  setStaffOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    staff.id === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                                {staff.user?.email || staff.email}
                              </CommandItem>
                            ))}
                            {staffLoading && (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="penaltyTypeId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Loại phạt</FormLabel>
                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? (() => {
                                const type = penaltyTypes.find(
                                  (t) => t.id === field.value,
                                );
                                return type
                                  ? `${type.name} - ${formatCurrency(type.amount)}`
                                  : 'Chọn loại phạt';
                              })()
                            : 'Chọn loại phạt'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Tìm kiếm loại phạt..." />
                        <CommandList
                          ref={typeListRef}
                          className="max-h-[300px] overflow-y-auto"
                        >
                          <CommandEmpty>Không tìm thấy loại phạt.</CommandEmpty>
                          <CommandGroup>
                            {penaltyTypes.map((type) => (
                              <CommandItem
                                value={type.name}
                                key={type.id}
                                onSelect={() => {
                                  form.setValue('penaltyTypeId', type.id);
                                  handleTypeChange(type.id.toString());
                                  setTypeOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    type.id === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                                {type.name} - {formatCurrency(type.amount)}
                              </CommandItem>
                            ))}
                            {typeLoading && (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Số tiền (VND)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={
                          Number(selectedType?.amount).toString() || '0'
                        }
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả vi phạm..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Minh chứng (Ảnh)</FormLabel>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById('evidence-upload')?.click()
                  }
                  className="w-full"
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Thêm ảnh minh chứng
                </Button>
                <input
                  id="evidence-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {evidenceFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {evidenceFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Minh chứng ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="text-xs truncate mt-1">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  {
                    onClose();
                    resetAllChange();
                  }
                }}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? 'Đang tải lên...' : 'Tạo phạt'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
