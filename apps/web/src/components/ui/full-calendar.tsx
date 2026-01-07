'use client';

import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/lib/utils';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from './button';

interface CalendarEvent {
  id: string | number;
  title: string;
  date: Date;
  type: 'cleaning' | 'opentalk' | 'holiday';
  color?: string;
}

interface FullCalendarProps {
  events?: CalendarEvent[];
  holidays?: Array<{
    id: number;
    date: string;
    name: string;
  }>;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
  currentMonthString?: string; // YYYY-MM format for URL control
  showControls?: boolean; // Whether to show month/type controls
}

export function FullCalendar({
  events = [],
  holidays = [],
  onEventClick,
  onDateClick,
  currentMonth: controlledMonth,
  onMonthChange,
  currentMonthString,
  showControls = true,
}: FullCalendarProps) {
  const [internalMonth, setInternalMonth] = useState(new Date());
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use controlled month if provided, otherwise use internal state
  const currentMonth = controlledMonth || internalMonth;

  // Get current month string for URL navigation
  const monthString = currentMonthString || format(currentMonth, 'yyyy-MM');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const previousMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
    );

    if (showControls && controlledMonth) {
      // Navigate with URL params when controls are enabled
      const previousMonthString = format(newMonth, 'yyyy-MM');
      const params = new URLSearchParams(searchParams);
      params.set('month', previousMonthString);
      router.push(`?${params.toString()}`);
    } else if (onMonthChange) {
      onMonthChange(newMonth);
    } else {
      setInternalMonth(newMonth);
    }
  };

  const nextMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
    );

    if (showControls && controlledMonth) {
      // Navigate with URL params when controls are enabled
      const nextMonthString = format(newMonth, 'yyyy-MM');
      const params = new URLSearchParams(searchParams);
      params.set('month', nextMonthString);
      router.push(`?${params.toString()}`);
    } else if (onMonthChange) {
      onMonthChange(newMonth);
    } else {
      setInternalMonth(newMonth);
    }
  };

  const goToToday = () => {
    const today = new Date();

    if (showControls && controlledMonth) {
      // Navigate with URL params when controls are enabled
      const todayString = format(today, 'yyyy-MM');
      const params = new URLSearchParams(searchParams);
      params.set('month', todayString);
      router.push(`?${params.toString()}`);
    } else if (onMonthChange) {
      onMonthChange(today);
    } else {
      setInternalMonth(today);
    }
  };

  const handleMonthSelect = (monthValue: string) => {
    if (showControls) {
      // Navigate with URL params when controls are enabled
      const params = new URLSearchParams(searchParams);
      params.set('month', monthValue);
      router.push(`?${params.toString()}`);
    } else {
      const newMonth = new Date(monthValue + '-01');
      if (onMonthChange) {
        onMonthChange(newMonth);
      } else {
        setInternalMonth(newMonth);
      }
    }
  };

  const handleTypeFilter = (type: string) => {
    if (showControls) {
      const params = new URLSearchParams(searchParams);
      if (type === 'all') {
        params.delete('type');
      } else {
        params.set('type', type);
      }
      router.push(`?${params.toString()}`);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        format(new Date(event.date), 'yyyy-MM-dd') ===
        format(date, 'yyyy-MM-dd'),
    );
  };

  const isHoliday = (date: Date) => {
    return holidays.some(
      (holiday) =>
        format(new Date(holiday.date), 'yyyy-MM-dd') ===
        format(date, 'yyyy-MM-dd'),
    );
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>

          {showControls && (
            <div className="flex items-center gap-2">
              <Select value={monthString} onValueChange={handleMonthSelect}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - 6 + i);
                    const value = format(date, 'yyyy-MM');
                    const label = format(date, 'MMMM yyyy');
                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select
                value={searchParams.get('type') || 'all'}
                onValueChange={handleTypeFilter}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="opentalk">Open Talk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const isHolidayDate = isHoliday(day);

            return (
              <div
                key={idx}
                onClick={() => onDateClick?.(day)}
                className={cn(
                  'min-h-25 p-2 border rounded-lg cursor-pointer transition-colors',
                  'hover:bg-accent',
                  !isCurrentMonth && 'bg-muted/50 text-muted-foreground',
                  isTodayDate && 'border-primary border-2',
                  isHolidayDate &&
                    'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
                )}
              >
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    isTodayDate && 'text-primary font-bold',
                    isHolidayDate && 'text-yellow-700 dark:text-yellow-300',
                  )}
                >
                  {format(day, 'd')}
                  {isHolidayDate && <span className="ml-1 text-xs">🎄</span>}
                </div>
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className={cn(
                        'text-xs p-1.5 rounded-md truncate cursor-pointer font-medium transition-colors hover:opacity-80',
                        event.type === 'cleaning'
                          ? 'bg-blue-200 text-blue-800 dark:bg-blue-300 dark:text-blue-900'
                          : event.type === 'opentalk'
                            ? 'bg-purple-200 text-purple-800 dark:bg-purple-300 dark:text-purple-900'
                            : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-300 dark:text-yellow-900',
                      )}
                      style={
                        event.color ? { backgroundColor: event.color } : {}
                      }
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-200 border border-blue-300"></div>
          <span className="text-sm font-medium">Cleaning Schedule</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-200 border border-purple-300"></div>
          <span className="text-sm font-medium">Open Talk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-200 border border-yellow-300"></div>
          <span className="text-sm font-medium">Holidays</span>
        </div>
      </div>
    </div>
  );
}
