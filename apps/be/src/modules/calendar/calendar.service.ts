import { Injectable } from '@nestjs/common';
import { ScheduleType } from '@qnoffice/shared';
import { CleaningService } from '@src/modules/cleaning/cleaning.service';
import { CleaningQueryDto } from '@src/modules/cleaning/dtos/cleaning-query.dto';
import { OpentalkQueryDto } from '@src/modules/opentalk/dtos/opentalk-query.dto';
import { OpentalkService } from '@src/modules/opentalk/opentalk.service';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  type: ScheduleType;
  status: string;
  participants: {
    id: number;
    email: string;
    name?: string;
  }[];
  notes?: string;
  slideStatus?: string;
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly cleaningService: CleaningService,
    private readonly opentalkService: OpentalkService,
  ) {}

  async getCalendarEvents(
    startDate?: string,
    endDate?: string,
  ): Promise<CalendarEvent[]> {
    const cleaningQuery: CleaningQueryDto = { startDate, endDate };
    const opentalkQuery: OpentalkQueryDto = { startDate, endDate };

    const [cleaningEvents, opentalkEvents] = await Promise.all([
      this.cleaningService.getEvents(cleaningQuery),
      this.opentalkService.getEvents(opentalkQuery),
    ]);

    const allEvents: CalendarEvent[] = [
      ...cleaningEvents.map((event) => this.mapToCalendarEvent(event)),
      ...opentalkEvents.map((event) => this.mapToCalendarEvent(event)),
    ];

    // Sort events by date
    return allEvents.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  private mapToCalendarEvent(event: ScheduleEventEntity): CalendarEvent {
    const slide = (event as any).slide;

    return {
      id: event.id,
      title: event.title,
      date: event.eventDate,
      type: event.type,
      status: event.status,
      participants:
        event.eventParticipants?.map((participant) => ({
          id: participant.staff.id,
          email: participant.staff.email,
          name: participant.staff.user?.name,
        })) || [],
      notes: event.notes,
      slideStatus: slide?.status,
    };
  }

  async getEventsByType(
    type: ScheduleType,
    startDate?: string,
    endDate?: string,
  ): Promise<CalendarEvent[]> {
    if (type === ScheduleType.CLEANING) {
      const query: CleaningQueryDto = { startDate, endDate };
      const events = await this.cleaningService.getEvents(query);
      return events.map((event) => this.mapToCalendarEvent(event));
    } else {
      const query: OpentalkQueryDto = { startDate, endDate };
      const events = await this.opentalkService.getEvents(query);
      return events.map((event) => this.mapToCalendarEvent(event));
    }
  }
}
