'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { opentalkClientService } from '@/shared/services/client/opentalk-client-service';
import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ViewSlideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  eventTitle: string;
}

export function ViewSlideDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
}: ViewSlideDialogProps) {
  const [submission, setSubmission] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (open && eventId) {
      fetchSlide();
    } else if (!open) {
      // Reset state when dialog closes
      setSubmission(null);
    }
  }, [open, eventId]);

  const fetchSlide = async () => {
    if (!eventId) return;

    setIsFetching(true);
    try {
      const data = await opentalkClientService.getSlideSubmission(eventId);
      setSubmission(data);
    } catch (error) {
      console.error('Failed to fetch slide submission:', error);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>View Slide</DialogTitle>
          <DialogDescription>
            Slide submission for <strong>{eventTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : submission ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Slides URL</Label>
              <div className="flex items-center gap-2">
                <a
                  href={submission.slidesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-blue-600 hover:underline truncate"
                >
                  {submission.slidesUrl}
                </a>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(submission.slidesUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {submission.topic && (
              <div className="space-y-2">
                <Label>Topic</Label>
                <p className="text-sm">{submission.topic}</p>
              </div>
            )}

            {submission.notes && (
              <div className="space-y-2">
                <Label>Notes</Label>
                <p className="text-sm whitespace-pre-wrap">
                  {submission.notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No slide submission found for this event.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
