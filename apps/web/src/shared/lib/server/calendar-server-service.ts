import { config } from '@/shared/lib/config';
import { ScheduleType } from '@qnoffice/shared';

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
}

export class CalendarServerService {
  private static getBaseUrl(): string {
    return config.backendBaseUrl;
  }

  static async getCalendarEvents(
    startDate?: string,
    endDate?: string,
    type?: ScheduleType,
  ): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (type) params.append('type', type);

      const url = `${this.getBaseUrl()}/calendar/events?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache control for server-side requests
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch calendar events: ${response.statusText}`,
        );
      }

      const result = await response.json();
      // Extract data from wrapped response
      return result.data || result;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  static async getCleaningEvents(
    startDate?: string,
    endDate?: string,
  ): Promise<CalendarEvent[]> {
    return this.getCalendarEvents(startDate, endDate, ScheduleType.CLEANING);
  }

  static async getOpentalkEvents(
    startDate?: string,
    endDate?: string,
  ): Promise<CalendarEvent[]> {
    return this.getCalendarEvents(startDate, endDate, ScheduleType.OPENTALK);
  }
}
