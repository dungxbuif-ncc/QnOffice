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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitSlideDto } from '@qnoffice/shared';
import { useState } from 'react';
import { toast } from 'sonner';

interface SubmitSlideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  onSuccess?: () => void;
}

export function SubmitSlideModal({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: SubmitSlideModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<SubmitSlideDto, 'eventId'>>({
    topic: '',
    slidesUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/opentalk/slides/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          slidesUrl: formData.slidesUrl,
          topic: formData.topic,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit slide');
      }

      toast.success('Slide submitted successfully');
      setFormData({ topic: '', slidesUrl: '' });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit slide');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Slide</DialogTitle>
          <DialogDescription>
            Submit your OpenTalk presentation slide for review
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                placeholder="e.g., Introduction to NestJS"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slidesUrl">Slide URL</Label>
              <Input
                id="slidesUrl"
                type="url"
                value={formData.slidesUrl}
                onChange={(e) =>
                  setFormData({ ...formData, slidesUrl: e.target.value })
                }
                placeholder="https://example.com/slides.pdf"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Slide'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
