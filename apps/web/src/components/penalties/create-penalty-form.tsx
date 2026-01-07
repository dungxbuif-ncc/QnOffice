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
import { createPenalty, getPenaltyTypes } from '@/shared/lib/penalty-api';
import { cn } from '@/shared/lib/utils';
import { CreatePenaltyDto, PenaltyType } from '@/shared/types/penalty';
import { Staff } from '@/shared/types/staff';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiResponse } from '@qnoffice/shared';
import { Check, ChevronsUpDown, ImagePlus, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const getStaff = async (params: { page: number; take: number }) => {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    take: params.take.toString(),
  });
  const response = await fetch(`/api/staffs?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch staff');
  const apiResponse: ApiResponse<{
    result: Staff[];
    total: number;
    page: number;
    pageSize: number;
  }> = await response.json();
  return apiResponse.data;
};

const formSchema = z.object({
  user_id: z.coerce.number().min(1, 'Staff member is required'),
  penalty_type_id: z.coerce.number().min(1, 'Penalty type is required'),
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().optional(),
  reason: z.string().min(1, 'Reason is required'),
  evidence_urls: z.array(z.string()).optional(),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: 0,
      penalty_type_id: 0,
      date: new Date().toISOString().split('T')[0],
      reason: '',
      evidence_urls: [],
    },
  });

  const loadStaff = async (page: number, append = false) => {
    if (staffLoading) return;
    try {
      setStaffLoading(true);
      const data = await getStaff({ page, take: 20 });
      setStaffList((prev) =>
        append ? [...prev, ...data.result] : data.result,
      );
      setStaffTotal(data.total);
    } catch (error) {
      toast.error('Failed to load staff');
    } finally {
      setStaffLoading(false);
    }
  };

  const loadPenaltyTypes = async (page: number, append = false) => {
    if (typeLoading) return;
    try {
      setTypeLoading(true);
      const types = await getPenaltyTypes();
      setPenaltyTypes(types);
      setTypeTotal(types.length);
    } catch (error) {
      toast.error('Failed to load penalty types');
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

      const payload: CreatePenaltyDto = {
        ...values,
        amount: values.amount || selectedType?.amount,
        evidence_urls: uploadedUrls,
      };

      await createPenalty(payload);
      toast.success('Penalty created successfully');
      onSuccess();
      onClose();
      form.reset();
      setEvidenceFiles([]);
    } catch (error) {
      toast.error('Failed to create penalty');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTypeChange = (typeId: string) => {
    const type = penaltyTypes.find((t) => t.id === Number(typeId));
    setSelectedType(type || null);
    if (type) {
      form.setValue('amount', type.amount);
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
      toast.error('Only image files are allowed');
    }

    setEvidenceFiles((prev) => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Penalty</DialogTitle>
          <DialogDescription>
            Create a new penalty record for a staff member
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Staff Member</FormLabel>
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
                            : 'Select staff member'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search staff..." />
                        <CommandList
                          onScroll={handleStaffScroll}
                          ref={staffListRef}
                          className="max-h-[300px] overflow-y-auto"
                        >
                          <CommandEmpty>No staff found.</CommandEmpty>
                          <CommandGroup>
                            {staffList.map((staff) => (
                              <CommandItem
                                value={staff.user?.email || staff.email}
                                key={staff.id}
                                onSelect={() => {
                                  form.setValue('user_id', staff.id);
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
              name="penalty_type_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Penalty Type</FormLabel>
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
                                  : 'Select penalty type';
                              })()
                            : 'Select penalty type'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search penalty type..." />
                        <CommandList
                          ref={typeListRef}
                          className="max-h-[300px] overflow-y-auto"
                        >
                          <CommandEmpty>No penalty type found.</CommandEmpty>
                          <CommandGroup>
                            {penaltyTypes.map((type) => (
                              <CommandItem
                                value={type.name}
                                key={type.id}
                                onSelect={() => {
                                  form.setValue('penalty_type_id', type.id);
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
                    <FormLabel>Date</FormLabel>
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
                    <FormLabel>Amount (VND)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={selectedType?.amount.toString() || '0'}
                        {...field}
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
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the violation..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Evidence (Images)</FormLabel>
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
                  Add Evidence Images
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
                        alt={`Evidence ${index + 1}`}
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Create Penalty'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
