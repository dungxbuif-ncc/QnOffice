'use client';

import { Badge } from '@/components/ui/badge';
import { BaseDataTable } from '@/components/ui/base-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePagination } from '@/shared/hooks/use-pagination';
import { PaginationState, Penalty, PenaltyStatus } from '@qnoffice/shared';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface PenaltiesDataTableProps {
  initialData: Penalty[];
  initialPagination: PaginationState;
}

export function PenaltiesDataTable({
  initialData,
  initialPagination,
}: PenaltiesDataTableProps) {
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);

  const pagination = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
  });

  const getStatusBadge = (status: PenaltyStatus) => {
    if (status === PenaltyStatus.PAID) {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Đã thanh toán
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        Chưa thanh toán
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const columns: ColumnDef<Penalty>[] = [
    {
      accessorKey: 'staffId',
      header: 'Nhân viên',
      cell: ({ row }) => {
        const staff = row.original.staff;
        return staff?.email
      },
    },
    {
      accessorKey: 'penaltyTypeId',
      header: 'Loại phạt',
      cell: ({ row }) => {
        const penaltyType = row.original.penaltyType;
        return penaltyType?.name || `Loại ${row.original.penaltyTypeId}`;
      },
    },
    {
      accessorKey: 'date',
      header: 'Ngày',
      cell: ({ row }) => format(new Date(row.original.date), 'PP'),
    },
    {
      accessorKey: 'reason',
      header: 'Lý do',
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.original.reason}</div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Số tiền',
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(Number(row.original.amount))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedPenalty(row.original)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <>
      <BaseDataTable
        columns={columns}
        initialData={initialData}
        initialPagination={initialPagination}
        pagination={pagination}
        searchPlaceholder="Tìm kiếm phạt..."
        showSearch={false}
      />

      {/* Penalty Detail Modal */}
      {selectedPenalty && (
        <Dialog
          open={!!selectedPenalty}
          onOpenChange={() => setSelectedPenalty(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết phạt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nhân viên</p>
                  <p className="font-medium">
                    {selectedPenalty.staff?.user?.name || selectedPenalty.staff?.email || selectedPenalty.staffId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loại phạt</p>
                  <p className="font-medium">
                    {selectedPenalty.penaltyType?.name || `Loại ${selectedPenalty.penaltyTypeId}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số tiền</p>
                  <p className="font-medium">
                    {formatCurrency(Number(selectedPenalty.amount))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày</p>
                  <p className="font-medium">
                    {format(new Date(selectedPenalty.date), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <div>{getStatusBadge(selectedPenalty.status)}</div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Lý do</p>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {selectedPenalty.reason}
                </p>
              </div>
              {selectedPenalty.evidenceUrls &&
                selectedPenalty.evidenceUrls.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Minh chứng
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPenalty.evidenceUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Minh chứng ${index + 1}`}
                          className="rounded-md border"
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
