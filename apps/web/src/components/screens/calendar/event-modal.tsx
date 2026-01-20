'use client';

import { FilePreviewDialog } from '@/components/opentalk/file-preview-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOpentalkSlide } from '@/shared/hooks/use-opentalk-slide';
import { uploadClientService } from '@/shared/services/client/upload-client-service';
import { OpentalkSlideType } from '@qnoffice/shared';
import { format } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Paperclip,
  Upload,
  Users,
} from 'lucide-react';
import { useState } from 'react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    date: Date;
    type: 'cleaning' | 'opentalk' | 'holiday';
    participants?: string[];
    notes?: string;
    status?: string;
    slideStatus?: string;
  } | null;
}

export function EventModal({ isOpen, onClose, event }: EventModalProps) {
  const { data: slide, isLoading: loadingSlide } = useOpentalkSlide(
    isOpen && event?.type.toLowerCase() === 'opentalk'
      ? Number(event.id)
      : null,
  );

  const [showPreview, setShowPreview] = useState(false);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  if (!event) return null;

  // ... helpers

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'cleaning':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'opentalk':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'holiday':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'cleaning':
        return 'Cleaning Schedule';
      case 'opentalk':
        return 'Open Talk';
      case 'holiday':
        return 'Holiday';
      default:
        return type;
    }
  };

  const handlePreview = async () => {
    const key = slide?.slideKey || slide?.slideUrl;
    if (!key) return;

    try {
      setLoadingPreview(true);
      const response =
        await uploadClientService.getOpentalkViewPresignedUrl(key);
      const downloadUrl =
        (response.data as any).data?.downloadUrl || response.data.downloadUrl;

      if (downloadUrl) {
        setPresignedUrl(downloadUrl);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Failed to fetch presigned URL:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const renderSlideStatus = () => {
    if (event.type.toLowerCase() !== 'opentalk') return null;

    if (loadingSlide) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading slide info...
        </div>
      );
    }

    // Use fetched status if available, fallback to list status
    const currentStatus = slide?.status || event.slideStatus;

    let icon = <Paperclip className="h-4 w-4 text-muted-foreground" />;
    let colorClass = 'text-muted-foreground';
    let label = 'Not submitted';

    if (currentStatus) {
      label = currentStatus;
      switch (currentStatus) {
        case 'APPROVED':
          icon = <CheckCircle className="h-4 w-4 text-green-500" />;
          colorClass = 'text-green-500';
          break;
        case 'PENDING':
          icon = <Clock className="h-4 w-4 text-yellow-500" />;
          colorClass = 'text-yellow-500';
          break;
        case 'REJECTED':
          icon = <AlertCircle className="h-4 w-4 text-red-500" />;
          colorClass = 'text-red-500';
          break;
        default:
          break;
      }
    }

    const hasSlide = slide?.slideUrl || slide?.slideKey;
    const isFileType = slide?.type === OpentalkSlideType.FILE;

    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Paperclip className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="font-medium mb-1">Slide Submission</p>
            <div className="flex items-center gap-2">
              {icon}
              <p className={`text-sm capitalize ${colorClass}`}>{label}</p>
            </div>
          </div>
        </div>

        {hasSlide && (
          <div className="ml-7">
            {isFileType ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={loadingPreview}
                className="gap-2"
              >
                <Upload className="h-3 w-3 rotate-180" />
                {loadingPreview ? 'Loading...' : 'Preview File'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  slide?.slideUrl && window.open(slide.slideUrl, '_blank')
                }
                className="gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                Open Link
              </Button>
            )}
          </div>
        )}

        {slide?.rejectionReason && currentStatus === 'REJECTED' && (
          <div className="ml-7 text-sm text-red-600 bg-red-50 p-2 rounded">
            Reason: {slide.rejectionReason}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {event.title}
            </DialogTitle>
            <DialogDescription>
              <Badge className={getEventTypeColor(event.type)}>
                {getEventTypeLabel(event.type)}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date and Time */}
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(event.date, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(event.date, 'h:mm a')}
                </p>
              </div>
            </div>

            {/* Participants */}
            {event.participants && event.participants.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Participants</p>
                  <div className="space-y-1">
                    {event.participants.map((participant, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        {participant}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            {event.status && (
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {event.status}
                  </p>
                </div>
              </div>
            )}

            {/* Slide Status */}
            {renderSlideStatus()}

            {/* Notes */}
            {event.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{event.notes}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        url={presignedUrl}
        fileName={slide?.slideKey || 'Slide'}
        fileType={slide?.mimeType}
      />
    </>
  );
}
