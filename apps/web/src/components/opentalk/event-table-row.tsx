'use client';

import { InlineEditControls } from '@/components/opentalk/inline-edit-controls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { getStatusBadgeProps } from '@/shared/utils';
import { IOpentalkSlide, ScheduleEvent } from '@qnoffice/shared';
import { Calendar, FileText, User } from 'lucide-react';

interface EventTableRowProps {
  event: ScheduleEvent<IOpentalkSlide>;
  isEditingTopic: boolean;
  isEditingDate: boolean;
  editedValue: string;

  canEditTopic: boolean;
  canEditSlide: boolean;
  canManageOpentalk: boolean;
  isSelected: boolean;
  isLocked?: boolean;

  onTopicEdit: (eventId: number, currentTopic: string) => void;
  onDateEdit: (eventId: number, date: string) => void;

  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;

  onSlideClick: () => void;
  onSelect: (checked: boolean) => void;
  formatDate: (date: string) => string;
}

export function EventTableRow({
  event,
  isEditingTopic,
  isEditingDate,
  editedValue,

  canEditTopic,
  canEditSlide,
  canManageOpentalk,
  isSelected,
  isLocked,

  onTopicEdit,
  onDateEdit,

  onEditChange,
  onEditSave,
  onEditCancel,

  onSlideClick,
  onSelect,
  formatDate,
}: EventTableRowProps) {
  const renderPresenter = () => {
    if (event.eventParticipants && event.eventParticipants.length > 0) {
      const presenters = event.eventParticipants
        .map((ep) => {
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

    return 'Unassigned';
  };

  const isPast = new Date(event.eventDate).getTime() < new Date().getTime();
  const isCompleted =
    event.status === 'COMPLETED' || event.status === 'CANCELLED';

  const isCheckboxDisabled = isLocked || isPast || isCompleted;

  return (
    <TableRow
      className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/50' : ''} ${
        isCheckboxDisabled ? 'opacity-60 bg-gray-50' : ''
      }`}
    >
      {canManageOpentalk && (
        <TableCell className="w-[50px]">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(checked as boolean)}
            disabled={isCheckboxDisabled}
          />
        </TableCell>
      )}

      <TableCell>
        {isEditingDate ? (
          <InlineEditControls
            type="date"
            value={editedValue}
            onChange={onEditChange}
            onSave={onEditSave}
            onCancel={onEditCancel}
          />
        ) : (
          <div
            className={`p-1 rounded ${
              canManageOpentalk ? 'cursor-pointer hover:bg-blue-50' : ''
            }`}
            onClick={() => {
              if (canManageOpentalk && !isCheckboxDisabled) {
                onDateEdit(event.id, event.eventDate);
              }
            }}
          >
            <div className="flex gap-1 items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatDate(event.eventDate)}
              </span>
            </div>
            {canManageOpentalk && !isCheckboxDisabled && (
              <span className="ml-1 text-xs text-muted-foreground">
                (click to edit)
              </span>
            )}
          </div>
        )}
      </TableCell>

      <TableCell>
        {isEditingTopic ? (
          <InlineEditControls
            value={editedValue}
            onChange={onEditChange}
            onSave={onEditSave}
            onCancel={onEditCancel}
          />
        ) : (
          <div
            className={`hover:bg-muted/50 p-1 rounded ${
              canEditTopic ? 'hover:bg-blue-50 cursor-pointer' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (canEditTopic && !isCheckboxDisabled) {
                onTopicEdit(event.id, event.title || '');
              }
            }}
          >
            <span className="font-medium">{event.title || 'No topic set'}</span>
            {canEditTopic && !isCheckboxDisabled && (
              <span className="ml-1 text-xs text-muted-foreground">
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
