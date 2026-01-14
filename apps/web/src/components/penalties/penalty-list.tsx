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
import { Penalty, PenaltyStatus, SearchOrder } from '@qnoffice/shared';
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
      const response = await fetch(
        `/api/penalties?page=${page}&take=10&order=${SearchOrder.DESC}`,
      );
      const data = await response.json();
      setPenalties(data.result || []);
      setTotal(data.total);
    } catch (error) {
      toast.error('Không thể tải danh sách phạt');
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

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            {showAllUsers && <TableHead>Nhân viên</TableHead>}
            <TableHead>Loại phạt</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Lý do</TableHead>
            <TableHead className="text-right">Số tiền</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {penalties.map((penalty) => (
            <TableRow key={penalty.id}>
              {showAllUsers && (
                <TableCell className="font-medium">
                  NV #{penalty?.staffId}
                </TableCell>
              )}
              <TableCell>Loại {penalty.penaltyTypeId}</TableCell>
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
          Hiển thị {penalties.length} trên tổng {total} lượt phạt
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 10 >= total}
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
