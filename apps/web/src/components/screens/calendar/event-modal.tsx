'use client';

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
import { format } from 'date-fns';
import { Calendar, Clock, FileText, Users } from 'lucide-react';

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
  } | null;
}

export function EventModal({ isOpen, onClose, event }: EventModalProps) {
  if (!event) return null;

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

  return (
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
  );
}
