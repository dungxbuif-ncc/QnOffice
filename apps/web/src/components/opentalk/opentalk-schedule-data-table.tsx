'use client';

import { CreateSwapRequestModal } from '@/components/opentalk/create-swap-request-modal';
import { SubmitSlideModal } from '@/components/opentalk/submit-slide-modal';
import { UpdateSubjectModal } from '@/components/opentalk/update-subject-modal';
import { Badge } from '@/components/ui/badge';
import { BaseDataTable } from '@/components/ui/base-data-table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PERMISSIONS, ProtectedComponent } from '@/shared/auth';
import { usePagination } from '@/shared/hooks/use-pagination';
import { EventStatus, PaginationState, SearchOrder } from '@qnoffice/shared';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

// Frontend-specific enums for opentalk schedules
enum SlideStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Frontend-specific type for opentalk schedule display
interface OpentalkSchedule {
  id: number;
  date: string;
  staff?: {
    email?: string;
    user?: {
      name?: string;
    };
  };
  topic?: string;
  slideStatus: SlideStatus;
  scheduleStatus: EventStatus;
  slideUrl?: string;
}

import {
    ArrowRightLeft,
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    ExternalLink,
    FileText,
    MoreHorizontal,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface OpentalkScheduleDataTableProps {
  initialData: OpentalkSchedule[];
  initialPagination: PaginationState;
  onScheduleUpdated?: () => void;
}

export function OpentalkScheduleDataTable({
  initialData,
  initialPagination,
}: OpentalkScheduleDataTableProps) {
  const [selectedSchedule, setSelectedSchedule] =
    useState<OpentalkSchedule | null>(null);
  const [submitSlideModalOpen, setSubmitSlideModalOpen] = useState(false);
  const [swapRequestModalOpen, setSwapRequestModalOpen] = useState(false);
  const [updateSubjectModalOpen, setUpdateSubjectModalOpen] = useState(false);

  const pagination = usePagination({
    defaultPage: 1,
    defaultOrder: SearchOrder.DESC,
  });

  const handleSubmitSlide = (schedule: OpentalkSchedule) => {
    setSelectedSchedule(schedule);
    setSubmitSlideModalOpen(true);
  };

  const handleRequestSwap = (schedule: OpentalkSchedule) => {
    setSelectedSchedule(schedule);
    setSwapRequestModalOpen(true);
  };

  const handleUpdateSubject = (schedule: OpentalkSchedule) => {
    setSelectedSchedule(schedule);
    setUpdateSubjectModalOpen(true);
  };

  const handleApproveSlide = async (scheduleId: number) => {
    try {
      const response = await fetch(
        `/api/opentalk/schedules/${scheduleId}/approve-slide`,
        {
          method: 'PUT',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to approve slide');
      }

      toast.success('Slide approved successfully');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve slide');
    }
  };

  const handleRejectSlide = async (scheduleId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(
        `/api/opentalk/schedules/${scheduleId}/reject-slide`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to reject slide');
      }

      toast.success('Slide rejected');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject slide');
    }
  };

  const getSlideStatusBadge = (status: SlideStatus) => {
    const variants: Record<
      SlideStatus,
      { variant: any; icon: any; label: string }
    > = {
      [SlideStatus.PENDING]: {
        variant: 'secondary',
        icon: Clock,
        label: 'Pending',
      },
      [SlideStatus.SUBMITTED]: {
        variant: 'default',
        icon: FileText,
        label: 'Submitted',
      },
      [SlideStatus.APPROVED]: {
        variant: 'default',
        icon: CheckCircle,
        label: 'Approved',
      },
      [SlideStatus.REJECTED]: {
        variant: 'destructive',
        icon: XCircle,
        label: 'Rejected',
      },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getEventStatusBadge = (status: EventStatus) => {
    const variants: Record<EventStatus, { variant: any; label: string }> = {
      [EventStatus.ACTIVE]: { variant: 'default', label: 'Active' },
      [EventStatus.COMPLETED]: { variant: 'secondary', label: 'Completed' },
      [EventStatus.PENDING]: { variant: 'outline', label: 'Swapped' },
      [EventStatus.CANCELLED]: {
        variant: 'destructive',
        label: 'Cancelled',
      },
    };

    const config = variants[status];

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isPastDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const columns: ColumnDef<OpentalkSchedule>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        const isPast = isPastDate(row.original.date);
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={isPast ? 'text-muted-foreground' : ''}>
              {format(date, 'MMM dd, yyyy (EEE)')}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'staff',
      header: 'Presenter',
      cell: ({ row }) => {
        const staff = row.original.staff;
        return (
          <div className="font-medium">
            {staff?.user?.name || staff?.email || 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'topic',
      header: 'Topic',
      cell: ({ row }) => {
        const topic = row.original.topic;
        return (
          <div className="max-w-[300px] truncate">
            {topic || (
              <span className="text-muted-foreground">Not submitted</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'slideStatus',
      header: 'Slide Status',
      cell: ({ row }) => getSlideStatusBadge(row.original.slideStatus),
    },
    {
      accessorKey: 'scheduleStatus',
      header: 'Status',
      cell: ({ row }) => getEventStatusBadge(row.original.scheduleStatus),
    },
    {
      accessorKey: 'slideUrl',
      header: 'Slide',
      cell: ({ row }) => {
        const url = row.original.slideUrl;
        if (!url) return <span className="text-muted-foreground">-</span>;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const schedule = row.original;
        const isPast = isPastDate(schedule.date);
        const canSubmitSlide =
          schedule.slideStatus === SlideStatus.PENDING ||
          schedule.slideStatus === SlideStatus.REJECTED;
        const canApprove = schedule.slideStatus === SlideStatus.SUBMITTED;
        const canSwap =
          schedule.scheduleStatus === EventStatus.PENDING && !isPast;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>

              {/* Employee actions */}
              {!isPast && (
                <DropdownMenuItem onClick={() => handleUpdateSubject(schedule)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Subject
                </DropdownMenuItem>
              )}

              {canSubmitSlide && !isPast && (
                <DropdownMenuItem onClick={() => handleSubmitSlide(schedule)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Submit Slide
                </DropdownMenuItem>
              )}

              {canSwap && (
                <DropdownMenuItem onClick={() => handleRequestSwap(schedule)}>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Request Swap
                </DropdownMenuItem>
              )}

              {/* HR/GDVP actions */}
              <ProtectedComponent permission={PERMISSIONS.MANAGE_OPENTALK}>
                {canApprove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleApproveSlide(schedule.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Approve Slide
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRejectSlide(schedule.id)}
                      className="text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Slide
                    </DropdownMenuItem>
                  </>
                )}
              </ProtectedComponent>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <BaseDataTable<OpentalkSchedule>
        columns={columns}
        initialData={initialData}
        initialPagination={initialPagination}
        pagination={pagination}
        searchPlaceholder="Search schedules..."
        showSearch={false}
      />

      {selectedSchedule && (
        <>
          <UpdateSubjectModal
            schedule={selectedSchedule}
            open={updateSubjectModalOpen}
            onOpenChange={setUpdateSubjectModalOpen}
            onSuccess={() => window.location.reload()}
          />
          <SubmitSlideModal
            open={submitSlideModalOpen}
            onOpenChange={setSubmitSlideModalOpen}
            eventId={selectedSchedule.id}
            onSuccess={() => window.location.reload()}
          />
          <CreateSwapRequestModal
            open={swapRequestModalOpen}
            onOpenChange={setSwapRequestModalOpen}
            scheduleId={selectedSchedule.id}
            onSuccess={() => window.location.reload()}
          />
        </>
      )}
    </>
  );
}
