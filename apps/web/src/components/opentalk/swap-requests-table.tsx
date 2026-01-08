'use client';

import { Badge } from '@/components/ui/badge';
import { BaseDataTable } from '@/components/ui/base-data-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PERMISSIONS, ProtectedComponent } from '@/shared/auth';
import { usePagination } from '@/shared/hooks/use-pagination';
import { SwapRequest, SwapRequestStatus } from '@qnoffice/shared';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { CheckCircle, Clock, MoreHorizontal, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SwapRequestsTableProps {
  requests: SwapRequest[];
}

export function SwapRequestsTable({ requests }: SwapRequestsTableProps) {
  const pagination = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
    defaultOrder: 'DESC',
  });

  const handleReview = async (requestId: number, status: SwapRequestStatus) => {
    const reviewNote =
      status === SwapRequestStatus.REJECTED
        ? prompt('Enter rejection reason:')
        : undefined;

    if (status === SwapRequestStatus.REJECTED && !reviewNote) return;

    try {
      const response = await fetch(
        `/api/opentalk/swap-requests/${requestId}/review`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, reviewNote }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to review swap request');
      }

      toast.success(
        `Swap request ${status === SwapRequestStatus.APPROVED ? 'approved' : 'rejected'}`,
      );
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to review swap request');
    }
  };

  const getStatusBadge = (status: SwapRequestStatus) => {
    const variants: Record<
      SwapRequestStatus,
      { variant: any; icon: any; label: string }
    > = {
      [SwapRequestStatus.PENDING]: {
        variant: 'secondary',
        icon: Clock,
        label: 'Pending',
      },
      [SwapRequestStatus.APPROVED]: {
        variant: 'default',
        icon: CheckCircle,
        label: 'Approved',
      },
      [SwapRequestStatus.REJECTED]: {
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

  const columns: ColumnDef<SwapRequest>[] = [
    {
      accessorKey: 'schedule.date',
      header: 'Schedule Date',
      cell: ({ row }) => {
        const date = new Date(row.original.schedule.date);
        return <div>{format(date, 'MMM dd, yyyy')}</div>;
      },
    },
    {
      accessorKey: 'requester',
      header: 'Requester',
      cell: ({ row }) => {
        const requester = row.original.requester;
        return (
          <div className="font-medium">
            {requester?.user?.name || requester?.email || 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'targetStaff',
      header: 'Target Staff',
      cell: ({ row }) => {
        const target = row.original.targetStaff;
        if (!target)
          return <span className="text-muted-foreground">Auto-assign</span>;
        return (
          <div className="font-medium">
            {target?.user?.name || target?.email || 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => {
        return (
          <div className="max-w-[300px] truncate" title={row.original.reason}>
            {row.original.reason}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'createdAt',
      header: 'Requested',
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return <div className="text-sm">{format(date, 'MMM dd, HH:mm')}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const request = row.original;
        const isPending = request.status === SwapRequestStatus.PENDING;

        return (
          <ProtectedComponent permission={PERMISSIONS.MANAGE_OPENTALK}>
            {isPending && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Review</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() =>
                      handleReview(request.id, SwapRequestStatus.APPROVED)
                    }
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleReview(request.id, SwapRequestStatus.REJECTED)
                    }
                    className="text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </ProtectedComponent>
        );
      },
    },
  ];

  return (
    <BaseDataTable<SwapRequest>
      columns={columns}
      initialData={requests}
      initialPagination={{
        page: 1,
        pageSize: 10,
        total: requests.length,
      }}
      pagination={pagination}
      searchPlaceholder="Search swap requests..."
      showSearch={false}
    />
  );
}
