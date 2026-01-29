'use client';

import { FilePreviewDialog } from '@/components/opentalk/file-preview-dialog';
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
import { uploadClientService } from '@/shared/services/client/upload-client-service';
import { PaginationState, Penalty, PenaltyStatus } from '@qnoffice/shared';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
    AlertCircle,
    CheckCircle2,
    ImageIcon
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface GroupedPenaltyData {
  staff: {
    id: number;
    email: string;
    user?: {
      name: string;
      email: string;
    };
  };
  totalAmount: number;
  penaltyCount: number;
  penalties: Penalty[];
}

interface PenaltiesDataTableProps {
  initialData: GroupedPenaltyData[];
  initialPagination: PaginationState;
}

export function PenaltiesDataTable({
  initialData,
  initialPagination,
}: PenaltiesDataTableProps) {
  const [selectedUserGroup, setSelectedUserGroup] = useState<GroupedPenaltyData | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewCache = useRef<Map<string, string>>(new Map());
  const [previewFileName, setPreviewFileName] = useState<string>('Bằng chứng');
  const [previewFileType, setPreviewFileType] = useState<string | undefined>();

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

  const getFileNameFromKey = (key: string) =>
    key.split('/').pop() || 'Bằng chứng';

  const getFileTypeFromMime = (mimeType?: string) => {
    if (!mimeType) return undefined;
    return mimeType.split('/')[1];
  };

  const handlePreview = async (proof: {
    imageKey: string;
    mimeType?: string;
  }) => {
    const key = proof.imageKey;

    const fileName = getFileNameFromKey(key);
    const fileType = getFileTypeFromMime(proof.mimeType);

    // cache
    if (previewCache.current.has(key)) {
      setPreviewUrl(previewCache.current.get(key)!);
      setPreviewFileName(fileName);
      setPreviewFileType(fileType);
      setShowPreview(true);
      return;
    }

    try {
      const response =
        await uploadClientService.getOpentalkViewPresignedUrl(key);

      const downloadUrl =
        (response.data as any)?.data?.downloadUrl || response.data?.downloadUrl;

      if (!downloadUrl) {
        toast.error('Không lấy được link xem file');
        return;
      }

      previewCache.current.set(key, downloadUrl);

      setPreviewUrl(downloadUrl);
      setPreviewFileName(fileName);
      setPreviewFileType(fileType);
      setShowPreview(true);
    } catch (e) {
      toast.error('Lỗi khi tải file');
    }
  };

  const columns: ColumnDef<GroupedPenaltyData>[] = [
    {
      accessorKey: 'staff',
      header: 'Nhân viên',
      cell: ({ row }) => {
        const staff = row.original.staff;
        return (
          <div>
            <div className="font-medium">{staff?.user?.name || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">
              {staff?.user?.email || staff?.email}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'penaltyCount',
      header: 'Số lượng vi phạm',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.penaltyCount}</div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Tổng tiền phạt',
      cell: ({ row }) => (
        <div className="font-medium text-red-600">
          {formatCurrency(row.original.totalAmount)}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedUserGroup(row.original)}
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

      {/* Group Detail Modal */}
      {selectedUserGroup && (
        <Dialog
          open={!!selectedUserGroup}
          onOpenChange={() => setSelectedUserGroup(null)}
        >
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Chi tiết vi phạm -{' '}
                {selectedUserGroup.staff?.user?.name ||
                  selectedUserGroup.staff?.email}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex gap-4 p-4 bg-muted/20 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng vi phạm</p>
                  <p className="text-xl font-bold">
                    {selectedUserGroup.penaltyCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng tiền phạt</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(selectedUserGroup.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedUserGroup.penalties.map((penalty, idx) => (
                  <div key={penalty.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">
                          {format(new Date(penalty.date), 'PPP')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {penalty.penaltyType?.name}
                        </p>
                      </div>
                      <div className="font-bold">
                        {formatCurrency(Number(penalty.amount))}
                      </div>
                    </div>
                    <div className="bg-muted p-2 rounded text-sm mb-3">
                      {penalty.reason}
                    </div>
                    {penalty.proofs && penalty.proofs.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {penalty.proofs.map((proof, pIdx) => (
                          <Button
                            key={pIdx}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handlePreview(proof)}
                          >
                            <ImageIcon className="h-3 w-3 mr-2" />
                            Xem bằng chứng
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <FilePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        url={previewUrl}
        fileName={previewFileName}
        fileType={previewFileType}
      />
    </>
  );
}
