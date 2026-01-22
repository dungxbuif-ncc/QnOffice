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
import { formatDateVN } from '@/shared/utils';
import { SwapRequest, SwapRequestStatus } from '@qnoffice/shared';
import { ArrowRightLeft, Check, User, X } from 'lucide-react';

interface SwapRequestTableProps {
  requests: SwapRequest[];
  onReview?: (id: number, status: SwapRequestStatus) => void;
  onView?: (request: SwapRequest) => void; // For user/hr to view details/notes
  isProcessingId?: number | null;
  readonly?: boolean;
}

export function SwapRequestTable({
  requests,
  onReview,
  onView,
  isProcessingId,
  readonly = false,
}: SwapRequestTableProps) {
  const getStatusBadge = (status: SwapRequestStatus) => {
    switch (status) {
      case SwapRequestStatus.APPROVED:
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Đã duyệt</Badge>
        );
      case SwapRequestStatus.REJECTED:
        return <Badge variant="destructive">Từ chối</Badge>;
      case SwapRequestStatus.PENDING:
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          >
            Chờ duyệt
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };


  const getPresenterInfo = (event: any) => {
    if (!event?.eventParticipants?.length) return null;
    const staff = event.eventParticipants[0]?.staff;
    return staff?.user?.name || staff?.email || 'Không xác định';
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <ArrowRightLeft className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-lg font-medium">Không có yêu cầu đổi lịch</p>
        <p className="text-sm text-muted-foreground mt-2">
          Danh sách yêu cầu đổi lịch sẽ hiển thị tại đây
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Người yêu cầu</TableHead>
            <TableHead>Từ sự kiện</TableHead>
            <TableHead>Đến sự kiện</TableHead>
            <TableHead>Lý do</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày yêu cầu</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const isApproved = request.status === SwapRequestStatus.APPROVED;
            const displayFromEvent = isApproved
              ? request.toEvent
              : request.fromEvent;
            const displayToEvent = isApproved
              ? request.fromEvent
              : request.toEvent;

            return (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">
                        {request.requester?.user?.name ||
                          request.requester?.user?.email ||
                          'Không xác định'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {request.requester?.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {displayFromEvent
                      ? formatDateVN(displayFromEvent.eventDate)
                      : 'N/A'}
                  </div>
                  <div className="text-xs font-medium text-blue-600">
                    {getPresenterInfo(displayFromEvent)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {displayFromEvent?.title || 'Không có tiêu đề'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {displayToEvent
                      ? formatDateVN(displayToEvent.eventDate)
                      : 'N/A'}
                  </div>
                  <div className="text-xs font-medium text-blue-600">
                    {getPresenterInfo(displayToEvent)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {displayToEvent?.title || 'Không có tiêu đề'}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate" title={request.reason}>
                  {request.reason}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateVN(request.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {!readonly &&
                      onReview &&
                      request.status === SwapRequestStatus.PENDING && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onReview(request.id, SwapRequestStatus.REJECTED)
                            }
                            disabled={isProcessingId === request.id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Từ chối
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              onReview(request.id, SwapRequestStatus.APPROVED)
                            }
                            disabled={isProcessingId === request.id}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Phê duyệt
                          </Button>
                        </>
                      )}
                    {/* For readonly or reviewed, maybe show Review Details button if onView provided */}
                    {onView && (request.reviewNote || readonly) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(request)}
                      >
                        Xem chi tiết
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
