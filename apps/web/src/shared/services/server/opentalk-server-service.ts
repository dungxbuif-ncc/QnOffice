import {
  CreateOpentalkCycleDto,
  CreateOpentalkEventDto,
  OpentalkEvent,
  ScheduleCycle,
  UpdateOpentalkCycleDto,
  UpdateOpentalkEventDto,
} from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

export interface OpentalkSpreadsheetData {
  events: OpentalkEvent[];
  cycles: ScheduleCycle[];
}

export class OpentalkServerService extends BaseServerService {
  private readonly baseUrl = '/opentalk';

  // Cycle operations
  async createCycle(data: CreateOpentalkCycleDto) {
    return this.post<ScheduleCycle>(`${this.baseUrl}/cycles`, data);
  }

  async getCycles() {
    const response = await this.get<ScheduleCycle[]>(`${this.baseUrl}/cycles`);
    return response || [];
  }

  async getCycleById(id: number) {
    return this.get<ScheduleCycle>(`${this.baseUrl}/cycles/${id}`);
  }

  async updateCycle(id: number, data: UpdateOpentalkCycleDto) {
    return this.put<ScheduleCycle>(`${this.baseUrl}/cycles/${id}`, data);
  }

  async deleteCycle(id: number) {
    return this.delete<void>(`${this.baseUrl}/cycles/${id}`);
  }

  // Event operations
  async createEvent(data: CreateOpentalkEventDto) {
    return this.post<OpentalkEvent>(`${this.baseUrl}/events`, data);
  }

  async getEvents() {
    const response = await this.get<OpentalkEvent[]>(`${this.baseUrl}/events`);
    return response || [];
  }

  async getEventsByCycle(cycleId: number) {
    const response = await this.get<OpentalkEvent[]>(
      `${this.baseUrl}/cycles/${cycleId}/events`,
    );
    return response || [];
  }

  async getEventById(id: number) {
    return this.get<OpentalkEvent>(`${this.baseUrl}/events/${id}`);
  }

  async updateEvent(id: number, data: UpdateOpentalkEventDto) {
    return this.put<OpentalkEvent>(`${this.baseUrl}/events/${id}`, data);
  }

  async deleteEvent(id: number) {
    return this.delete<void>(`${this.baseUrl}/events/${id}`);
  }

  // Additional operations
  async getSpreadsheetData(): Promise<OpentalkSpreadsheetData> {
    return this.get<OpentalkSpreadsheetData>(`${this.baseUrl}/spreadsheet`);
  }

  async swapEvents(eventId1: number, eventId2: number): Promise<void> {
    return this.post<void>(`${this.baseUrl}/swap`, { eventId1, eventId2 });
  }

  async bulkAssignEvents(data: {
    eventIds: number[];
    participantIds: number[];
  }): Promise<void> {
    return this.post<void>(`${this.baseUrl}/bulk-assign`, data);
  }

  async getConflicts(): Promise<any[]> {
    const response = await this.get<any[]>(`${this.baseUrl}/conflicts`);
    return response || [];
  }

  // Legacy compatibility methods
  async getOpentalkEvents(): Promise<OpentalkEvent[]> {
    return this.getEvents();
  }
}

// Create a singleton instance
export const opentalkServerService = new OpentalkServerService();
