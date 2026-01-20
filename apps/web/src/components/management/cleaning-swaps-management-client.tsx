'use client';

import { SwapRequestTable } from '@/components/cleaning/swap-request-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PERMISSIONS, ProtectedComponent } from '@/shared/auth';
import { swapRequestClientService } from '@/shared/services/client/swap-request-client-service';
import { SwapRequest, SwapRequestStatus } from '@qnoffice/shared';
import { useState } from 'react';
import { toast } from 'sonner';

interface CleaningSwapsManagementClientProps {
  initialData: SwapRequest[];
}

export function CleaningSwapsManagementClient({
  initialData = [],
}: CleaningSwapsManagementClientProps) {
  // Placeholder data structure for when API is ready
  const [requests, setRequests] = useState<SwapRequest[]>(initialData);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{
    id: number;
    status: SwapRequestStatus;
  } | null>(null);

  const pendingCount = requests.filter(
    (r) => r.status === SwapRequestStatus.PENDING,
  ).length;

  const processReview = async (id: number, status: SwapRequestStatus) => {
    setIsProcessing(id);
    try {
      await swapRequestClientService.reviewSwapRequest(id, {
        status,
        reviewNote:
          status === SwapRequestStatus.APPROVED ? 'Approved' : 'Rejected',
      });

      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, status } : req)),
      );

      toast.success(
        status === SwapRequestStatus.APPROVED
          ? 'Đã phê duyệt yêu cầu'
          : 'Đã từ chối yêu cầu',
      );
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi xử lý yêu cầu');
    } finally {
      setIsProcessing(null);
      setConfirmOpen(false);
      setSelectedRequest(null);
    }
  };

  const handleReview = (id: number, status: SwapRequestStatus) => {
    setSelectedRequest({ id, status });
    setConfirmOpen(true);
  };

  return (
    <ProtectedComponent permission={PERMISSIONS.MANAGE_CLEANING_SWAP_REQUESTS}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Yêu cầu đổi lịch trực nhật</h1>
            <p className="text-muted-foreground">
              Xem xét và phê duyệt/từ chối yêu cầu đổi lịch trực nhật
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingCount}
              </div>
              <div className="text-muted-foreground">Chờ duyệt</div>
            </div>
          </div>
        </div>

        <SwapRequestTable
          requests={requests}
          onReview={handleReview}
          isProcessingId={isProcessing}
        />
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedRequest?.status === SwapRequestStatus.APPROVED
                ? 'Xác nhận phê duyệt'
                : 'Xác nhận từ chối'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRequest?.status === SwapRequestStatus.APPROVED
                ? 'Bạn có chắc chắn muốn phê duyệt yêu cầu đổi lịch này không?'
                : 'Bạn có chắc chắn muốn từ chối yêu cầu đổi lịch này không?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                selectedRequest &&
                processReview(selectedRequest.id, selectedRequest.status)
              }
              disabled={isProcessing !== null}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedComponent>
  );
}
