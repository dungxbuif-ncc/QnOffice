'use client';

import { SlideDialog } from '@/components/opentalk/slide-dialog';
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
import { PERMISSIONS, ProtectedComponent } from '@/shared/auth';
import { formatDateVN } from '@/shared/utils';
import { OpentalkSlideStatus, OpentalkSlideType, type IOpentalkSlide, type ScheduleEvent } from '@qnoffice/shared';
import { useQueryClient } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface OpentalkSlidesManagementClientProps {
  events: (ScheduleEvent & { slide?: IOpentalkSlide | null })[];
}

export function OpentalkSlidesManagementClient({ events }: OpentalkSlidesManagementClientProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Filter events that have slides
  const eventsWithSlides = events.filter((event) => event.slide);
  
  // Group by status
  const pendingSlides = eventsWithSlides.filter(
    (event) => event.slide?.status === OpentalkSlideStatus.PENDING
  );
  const approvedSlides = eventsWithSlides.filter(
    (event) => event.slide?.status === OpentalkSlideStatus.APPROVED
  );
  const rejectedSlides = eventsWithSlides.filter(
    (event) => event.slide?.status === OpentalkSlideStatus.REJECTED
  );

  const handleViewSlide = (event: any) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['opentalk-events'] });
    setDialogOpen(false);
    toast.success('Đã cập nhật trạng thái slide');
  };

  const getStatusBadge = (status: OpentalkSlideStatus) => {
    const variants: Record<OpentalkSlideStatus, { variant: any; label: string }> = {
      [OpentalkSlideStatus.PENDING]: { variant: 'secondary', label: 'Chờ duyệt' },
      [OpentalkSlideStatus.APPROVED]: { variant: 'default', label: 'Đã duyệt' },
      [OpentalkSlideStatus.REJECTED]: { variant: 'destructive', label: 'Từ chối' },
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <ProtectedComponent permission={PERMISSIONS.MANAGE_OPENTALK}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Duyệt Slide OpenTalk</h1>
            <p className="text-muted-foreground">
              Xem xét và phê duyệt/từ chối slide đã nộp
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingSlides.length}</div>
              <div className="text-muted-foreground">Chờ duyệt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{approvedSlides.length}</div>
              <div className="text-muted-foreground">Đã duyệt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedSlides.length}</div>
              <div className="text-muted-foreground">Từ chối</div>
            </div>
          </div>
        </div>

        {eventsWithSlides.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">Không tìm thấy slide nào</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề sự kiện</TableHead>
                  <TableHead>Ngày diễn ra</TableHead>
                  <TableHead>Loại slide</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày nộp</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsWithSlides.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      {formatDateVN(event.eventDate)}
                    </TableCell>
                    <TableCell>
                      {event.slide?.type === OpentalkSlideType.FILE ? '📄 File' : '🔗 Link'}
                    </TableCell>
                    <TableCell>
                      {event.slide && getStatusBadge(event.slide.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.slide?.createdAt && 
                        formatDateVN(event.slide.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSlide(event)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Xem xét
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedEvent && (
          <SlideDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            event={selectedEvent}
            mode="view"
            canApprove={true}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </ProtectedComponent>
  );
}
