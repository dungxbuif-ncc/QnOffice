'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPenalties } from '@/shared/lib/penalty-api';
import { Penalty } from '@/shared/types/penalty';
import { PenaltyStatus, SearchOrder } from '@qnoffice/shared';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PenaltyListProps {
  showAllUsers?: boolean;
}

export function PenaltyList({ showAllUsers = false }: PenaltyListProps) {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadPenalties = async () => {
    try {
      const data = await getPenalties({
        page,
        take: 10,
        order: SearchOrder.DESC,
      });
      setPenalties(data.result || []);
      setTotal(data.total);
    } catch (error) {
      toast.error('Failed to load penalties');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPenalties();
  }, [page]);

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            {showAllUsers && <TableHead>Staff</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {penalties.map((penalty) => (
            <TableRow key={penalty.id}>
              {showAllUsers && (
                <TableCell className="font-medium">
                  User #{penalty.user_id}
                </TableCell>
              )}
              <TableCell>{penalty.penaltyType?.name || 'Unknown'}</TableCell>
              <TableCell>{format(new Date(penalty.date), 'PP')}</TableCell>
              <TableCell className="max-w-xs truncate">
                {penalty.reason}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(Number(penalty.amount))}
              </TableCell>
              <TableCell>{getStatusBadge(penalty.status)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {penalties.length} of {total} penalties
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 10 >= total}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
