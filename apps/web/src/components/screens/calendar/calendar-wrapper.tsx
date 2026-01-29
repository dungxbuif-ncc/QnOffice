'use client';

import { FullCalendar } from '@/components/ui/full-calendar';
import { useState } from 'react';
import { EventModal } from './event-modal';

interface CalendarWrapperProps {
  events: Array<{
    id: string;
    title: string;
    date: string;
    type: 'cleaning' | 'opentalk' | 'holiday';
    participants?: string[];
    notes?: string;
    status?: string;
    slideStatus?: string;
  }>;
  holidays?: Array<{
    id: number;
    date: string | Date;
    name: string;
  }>;
  currentMonth: Date;
  currentMonthString: string;
  showControls?: boolean;
}

import { useAuth } from '@/shared/contexts/auth-context';

export function CalendarWrapper({
  events,
  holidays,
  currentMonth,
  currentMonthString,
  showControls = true,
}: CalendarWrapperProps) {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    title: string;
    date: Date;
    type: 'cleaning' | 'opentalk' | 'holiday';
    participants?: string[];
    notes?: string;
    status?: string;
    slideStatus?: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert events to match FullCalendar's interface
  const calendarEvents = events.map((event) => {
    const isMine =
      user?.email &&
      event.participants?.some(
        (p) => p.toLowerCase() === user.email.toLowerCase(),
      );

    return {
      id: event.id,
      title: event.title,
      date: new Date(event.date),
      type: event.type,
      isMine: !!isMine,
      color:
        event.type === 'cleaning'
          ? '#bfdbfe'
          : event.type === 'opentalk'
            ? '#ddd6fe'
            : '#fef3c7', // Holiday color
    };
  });

  const handleEventClick = (event: {
    id: string | number;
    title: string;
    date: Date;
    type: 'cleaning' | 'opentalk' | 'holiday';
    color?: string;
  }) => {
    // Find the original event data with more details
    const originalEvent = events.find((e) => e.id === event.id.toString());

    if (originalEvent) {
      setSelectedEvent({
        id: originalEvent.id,
        title: originalEvent.title,
        date: new Date(originalEvent.date),
        type: originalEvent.type,
        participants: originalEvent.participants,
        notes: originalEvent.notes,
        status: originalEvent.status,
        slideStatus: originalEvent.slideStatus,
      });
      setIsModalOpen(true);
    }
  };

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
  };

  return (
    <>
      <FullCalendar
        events={calendarEvents}
        holidays={holidays}
        currentMonth={currentMonth}
        currentMonthString={currentMonthString}
        showControls={showControls}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
      />

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </>
  );
}
