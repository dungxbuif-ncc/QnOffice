import {
  CreateCycleDto,
  CreateEventDto,
  ScheduleCycle,
  ScheduleEvent,
  UpdateEventDto,
} from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

export interface ScheduleQueryParams {
  type?: string;
  status?: string;
  cycleId?: number;
  startDate?: string;
  endDate?: string;
}

export class ScheduleServerService extends BaseServerService {
  private readonly baseUrl = '/schedules';

  // Cycle endpoints
  async getAllCycles(type?: string): Promise<ScheduleCycle[]> {
    try {
      const url = type
        ? `${this.baseUrl}/cycles?type=${type}`
        : `${this.baseUrl}/cycles`;
      const response = await this.get<ScheduleCycle[]>(url);
      return response || [];
    } catch (error) {
      console.error('Failed to fetch cycles:', error);
      throw error;
    }
  }

  async getCycleById(id: number): Promise<ScheduleCycle | null> {
    try {
      const response = await this.get<ScheduleCycle>(
        `${this.baseUrl}/cycles/${id}`,
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch cycle:', error);
      throw error;
    }
  }

  async createCycle(data: CreateCycleDto): Promise<ScheduleCycle> {
    try {
      const response = await this.post<ScheduleCycle>(
        `${this.baseUrl}/cycles`,
        data,
      );
      return response;
    } catch (error) {
      console.error('Failed to create cycle:', error);
      throw error;
    }
  }

  // Event endpoints
  async getAllEvents(
    params: ScheduleQueryParams = {},
  ): Promise<ScheduleEvent[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params.type) searchParams.set('type', params.type);
      if (params.status) searchParams.set('status', params.status);
      if (params.cycleId)
        searchParams.set('cycleId', params.cycleId.toString());
      if (params.startDate) searchParams.set('startDate', params.startDate);
      if (params.endDate) searchParams.set('endDate', params.endDate);

      const query = searchParams.toString();
      const url = query
        ? `${this.baseUrl}/events?${query}`
        : `${this.baseUrl}/events`;

      const response = await this.get<ScheduleEvent[]>(url);
      return response || [];
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw error;
    }
  }

  async getEventsByCycle(cycleId: number): Promise<ScheduleEvent[]> {
    try {
      const response = await this.get<ScheduleEvent[]>(
        `${this.baseUrl}/cycles/${cycleId}/events`,
      );
      return response || [];
    } catch (error) {
      console.error('Failed to fetch events by cycle:', error);
      throw error;
    }
  }

  async getEventById(id: number): Promise<ScheduleEvent | null> {
    try {
      const response = await this.get<ScheduleEvent>(
        `${this.baseUrl}/events/${id}`,
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch event:', error);
      throw error;
    }
  }

  async createEvent(data: CreateEventDto): Promise<ScheduleEvent> {
    try {
      const response = await this.post<ScheduleEvent>(
        `${this.baseUrl}/events`,
        data,
      );
      return response;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  async updateEvent(id: number, data: UpdateEventDto): Promise<ScheduleEvent> {
    try {
      const response = await this.put<ScheduleEvent>(
        `${this.baseUrl}/events/${id}`,
        data,
      );
      return response;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<void> {
    try {
      await this.delete(`${this.baseUrl}/events/${id}`);
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  async swapEventParticipants(
    event1Id: number,
    event2Id: number,
  ): Promise<void> {
    try {
      await this.post(
        `${this.baseUrl}/events/${event1Id}/swap/${event2Id}`,
        {},
      );
    } catch (error) {
      console.error('Failed to swap event participants:', error);
      throw error;
    }
  }

  // Helper methods for opentalk compatibility
  async getOpentalkEvents(
    params: ScheduleQueryParams = {},
  ): Promise<ScheduleEvent[]> {
    return this.getAllEvents({ ...params, type: 'OPENTALK' });
  }

  async getCleaningEvents(
    params: ScheduleQueryParams = {},
  ): Promise<ScheduleEvent[]> {
    return this.getAllEvents({ ...params, type: 'CLEANING' });
  }
}

export const scheduleServerService = new ScheduleServerService();
