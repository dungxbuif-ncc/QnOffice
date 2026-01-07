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
import { PaginationState } from '@/shared/types/pagination';
import { Penalty } from '@/shared/types/penalty';
import { PenaltyStatus } from '@qnoffice/shared';
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
          Paid
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        Unpaid
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
      accessorKey: 'user_id',
      header: 'User ID',
      cell: ({ row }) => row.original.user_id,
    },
    {
      accessorKey: 'penaltyType',
      header: 'Type',
      cell: ({ row }) => row.original.penaltyType?.name || 'Unknown',
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.date), 'PP'),
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.original.reason}</div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(Number(row.original.amount))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
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
          View Details
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
        searchPlaceholder="Search penalties..."
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
              <DialogTitle>Penalty Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-medium">{selectedPenalty.user_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {selectedPenalty.penaltyType?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">
                    {formatCurrency(Number(selectedPenalty.amount))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedPenalty.date), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedPenalty.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Campaign ID</p>
                  <p className="font-medium">
                    {selectedPenalty.campaign_id || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Reason</p>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {selectedPenalty.reason}
                </p>
              </div>
              {selectedPenalty.penaltyType?.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Type Description
                  </p>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {selectedPenalty.penaltyType.description}
                  </p>
                </div>
              )}
              {selectedPenalty.evidence_urls &&
                selectedPenalty.evidence_urls.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Evidence
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPenalty.evidence_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Evidence ${index + 1}`}
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
