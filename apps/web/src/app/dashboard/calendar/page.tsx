import { CalendarWrapper } from '@/components/screens/calendar/calendar-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarEvent,
  CalendarServerService,
} from '@/shared/services/server/calendar-server-service';
import { HolidayServerService } from '@/shared/services/server/holiday-server-service';
import { Holiday, ScheduleType } from '@qnoffice/shared';
import { format } from 'date-fns';

interface CalendarPageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    month?: string; // YYYY-MM format
    type?: ScheduleType;
  }>;
}

function mapCalendarEventsToFullCalendar(events: CalendarEvent[]) {
  if (!events || !Array.isArray(events)) {
    return [];
  }
  return events.map((event) => ({
    id: event.id.toString(),
    title: event.title,
    date: new Date(event.date),
    type: event.type.toLowerCase() as 'cleaning' | 'opentalk',
    participants: event.participants?.map(
      (p) => p.email || p.name || 'Unknown',
    ),
    notes: event.notes,
    status: event.status,
  }));
}

function mapHolidaysToCalendarEvents(holidays: Holiday[]) {
  if (!holidays || !Array.isArray(holidays)) {
    return [];
  }
  return holidays.map((holiday) => ({
    id: `holiday-${holiday.id}`,
    title: holiday.name,
    date: new Date(holiday.date),
    type: 'holiday' as const,
  }));
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const params = await searchParams;

  // Debug the incoming parameters
  console.log('CalendarPage received params:', params);

  // Determine the current month for display
  let currentMonth: string;
  let startDate: string;
  let endDate: string;

  if (params.month) {
    // Use specified month
    currentMonth = params.month;
    startDate = `${params.month}-01`;
    const date = new Date(startDate);
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    endDate = `${params.month}-${lastDay.toString().padStart(2, '0')}`;
  } else if (params.startDate && params.endDate) {
    // Use specific date range
    startDate = params.startDate;
    endDate = params.endDate;
    // Extract month from startDate for controls
    currentMonth = params.startDate.substring(0, 7);
  } else {
    // Default to current month
    currentMonth = format(new Date(), 'yyyy-MM');
    startDate = `${currentMonth}-01`;
    const date = new Date(startDate);
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    endDate = `${currentMonth}-${lastDay.toString().padStart(2, '0')}`;
  }

  const events = await CalendarServerService.getCalendarEvents(
    startDate,
    endDate,
    params.type,
  );

  // Fetch holidays for the same period
  const holidayService = new HolidayServerService();
  const holidays = await holidayService.getAll({
    startDate,
    endDate,
  });

  const safeEvents = Array.isArray(events) ? events : [];
  const safeHolidays = holidays?.result || [];

  const calendarEvents = mapCalendarEventsToFullCalendar(safeEvents);
  const holidayEvents = mapHolidaysToCalendarEvents(safeHolidays);

  // Combine all events
  const allEvents = [...calendarEvents, ...holidayEvents];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Office Schedule Calendar
            <span className="text-sm text-muted-foreground ml-2">
              ({safeEvents.length} events, {safeHolidays.length} holidays)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            <p>
              Showing events from {startDate} to {endDate}
              {params.type && ` (filtered by ${params.type})`}
            </p>
          </div>
          <CalendarWrapper
            events={allEvents}
            holidays={safeHolidays}
            currentMonth={new Date(startDate)}
            currentMonthString={currentMonth}
            showControls={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
