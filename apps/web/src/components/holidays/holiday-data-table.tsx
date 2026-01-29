'use client';

import { EditHolidayModal } from '@/components/holidays/edit-holiday-modal';
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
import { formatDateVN } from '@/shared/utils';
import { Holiday, PaginationState, SearchOrder } from '@qnoffice/shared';
import { ColumnDef } from '@tanstack/react-table';
import { Calendar, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface HolidayDataTableProps {
  initialData: Holiday[];
  initialPagination: PaginationState;
  onHolidayUpdated?: () => void;
}

export function HolidayDataTable({
  initialData,
  initialPagination,
}: HolidayDataTableProps) {
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const pagination = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
    defaultOrder: SearchOrder.DESC,
  });

  const isPastDate = (dateOrString: string | Date) => {
    const date = new Date(dateOrString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleEdit = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setEditModalOpen(true);
  };

  const handleHolidayUpdated = () => {
    window.location.reload();
  };

  const columns: ColumnDef<Holiday>[] = [
    {
      accessorKey: 'date',
      header: 'Ngày',
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        const isPast = isPastDate(row.original.date);
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={isPast ? 'text-muted-foreground' : ''}>
              {formatDateVN(row.original.date)}
            </span>
            {isPast && (
              <Badge variant="secondary" className="ml-2">
                Đã qua
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Tên ngày nghỉ',
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const holiday = row.original;
        const isPast = isPastDate(holiday.date);

        return (
          <ProtectedComponent permission={PERMISSIONS.MANAGE_HOLIDAYS}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Mở menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleEdit(holiday)}
                  disabled={isPast}
                >
                  {isPast ? 'Không thể sửa (Đã qua)' : 'Chỉnh sửa'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ProtectedComponent>
        );
      },
    },
  ];

  return (
    <>
      <BaseDataTable<Holiday>
        columns={columns}
        initialData={initialData}
        initialPagination={initialPagination}
        pagination={pagination}
        searchPlaceholder="Tìm kiếm ngày nghỉ..."
        showSearch={false}
      />
      <EditHolidayModal
        holiday={selectedHoliday}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleHolidayUpdated}
      />
    </>
  );
}
