'use client';

import { UpdateMezonIdModal } from '@/components/staff/update-mezon-id-modal';
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
import { getRoleLabel, PERMISSIONS, ProtectedComponent } from '@/shared/auth';
import { usePagination } from '@/shared/hooks/use-pagination';
import {
  PaginationState,
  SearchOrder,
  Staff,
  StaffStatus,
} from '@qnoffice/shared';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface StaffDataTableProps {
  initialData: Staff[];
  initialPagination: PaginationState;
  onStaffUpdated?: () => void;
}

const getStatusBadge = (status: StaffStatus) => {
  switch (status) {
    case StaffStatus.ACTIVE:
      return <Badge variant="default">Active</Badge>;
    case StaffStatus.ON_LEAVE:
      return <Badge variant="secondary">On Leave</Badge>;
    case StaffStatus.LEAVED:
      return <Badge variant="destructive">Left</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export function StaffDataTable({
  initialData,
  initialPagination,
}: StaffDataTableProps) {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [updateMezonIdModalOpen, setUpdateMezonIdModalOpen] = useState(false);

  // Use the base pagination hook
  const pagination = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
    defaultOrder: SearchOrder.DESC,
  });

  const handleUpdateMezonId = (staff: Staff) => {
    setSelectedStaff(staff);
    setUpdateMezonIdModalOpen(true);
  };

  const handleStaffUpdated = () => {
    window.location.reload();
  };

  const columns: ColumnDef<Staff>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <div>{row.original.email || 'N/A'}</div>,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="outline">
          {getRoleLabel(
            row.original.role !== null && row.original.role !== undefined
              ? row.original.role
              : row?.original?.user?.role,
          ) || 'N/A'}
        </Badge>
      ),
    },
    {
      accessorKey: 'branch.name',
      header: 'Branch',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.branch?.name || 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.branch?.code || ''}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        return getStatusBadge(row.getValue('status'));
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const staff = row.original;

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
              <ProtectedComponent permission={PERMISSIONS.EDIT_STAFF}>
                <DropdownMenuItem onClick={() => handleUpdateMezonId(staff)}>
                  Update Mezon ID
                </DropdownMenuItem>
              </ProtectedComponent>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  return (
    <>
      <BaseDataTable
        columns={columns}
        initialData={initialData}
        initialPagination={initialPagination}
        pagination={pagination}
        searchPlaceholder="Search staff by email..."
        showSearch={false} // We'll handle search differently for now
      />
      {selectedStaff && (
        <UpdateMezonIdModal
          staff={selectedStaff}
          open={updateMezonIdModalOpen}
          onOpenChange={setUpdateMezonIdModalOpen}
          onStaffUpdated={handleStaffUpdated}
        />
      )}
    </>
  );
}
