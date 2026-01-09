'use client';

import { TopicEditControls } from '@/components/opentalk/topic-edit-controls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { getStatusBadgeProps } from '@/shared/utils';
import { Calendar, FileText, User } from 'lucide-react';

interface EventTableRowProps {
  event: any;
  isSelected: boolean;
  isEditingTopic: boolean;
  editedTopicValue: string;
  canEditTopic: boolean;
  canEditSlide: boolean;
  onSelect: () => void;
  onTopicEdit: (topic: string) => void;
  onTopicSave: () => void;
  onTopicCancel: () => void;
  onTopicChange: (value: string) => void;
  onSlideClick: () => void;
  formatDate: (date: string) => string;
}

export function EventTableRow({
  event,
  isSelected,
  isEditingTopic,
  editedTopicValue,
  canEditTopic,
  canEditSlide,
  onSelect,
  onTopicEdit,
  onTopicSave,
  onTopicCancel,
  onTopicChange,
  onSlideClick,
  formatDate,
}: EventTableRowProps) {
  const renderPresenter = () => {
    if (event.eventParticipants && event.eventParticipants.length > 0) {
      const presenters = event.eventParticipants
        .map((ep: any) => {
          if (ep.staff?.email) return ep.staff.email;
          if (ep.staff?.user?.email) return ep.staff.user.email;
          if (ep.staff?.id) return `Staff ${ep.staff.id}`;
          if (ep.staffId) return `Staff ${ep.staffId}`;
          return 'Unknown Staff';
        })
        .filter(Boolean);

      if (presenters.length > 0) {
        return presenters.join(', ');
      }
    }

    if (event.participants && event.participants.length > 0) {
      const presenters = event.participants
        .map((p: any) => {
          if (p.email) return p.email;
          if (p.user?.email) return p.user.email;
          if (p.id) return `Staff ${p.id}`;
          return 'Unknown Staff';
        })
        .filter(Boolean);

      if (presenters.length > 0) {
        return presenters.join(', ');
      }
    }

    if (event.participantIds && event.participantIds.length > 0) {
      return `Staff ${event.participantIds[0]}`;
    }

    return 'Unassigned';
  };

  return (
    <TableRow
      className={`hover:bg-muted/50 ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {formatDate(event.eventDate)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {isEditingTopic ? (
          <TopicEditControls
            value={editedTopicValue}
            onChange={onTopicChange}
            onSave={onTopicSave}
            onCancel={onTopicCancel}
          />
        ) : (
          <div
            className={`cursor-pointer hover:bg-muted/50 p-1 rounded ${
              canEditTopic ? 'hover:bg-blue-50' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (canEditTopic) {
                onTopicEdit(event.title);
              }
            }}
          >
            <span className="font-medium">{event.title || 'No topic set'}</span>
            {canEditTopic && (
              <span className="text-xs text-muted-foreground ml-1">
                (click to edit)
              </span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{renderPresenter()}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge {...getStatusBadgeProps(event.status)} />
      </TableCell>
      <TableCell>
        <Button size="sm" variant="outline" onClick={onSlideClick}>
          <FileText className="h-4 w-4 mr-1" />
          {canEditSlide ? 'Update' : 'View'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
