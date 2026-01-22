import {
  ICreateOpentalkCycleDto,
  IOpentalkQueryDto,
  ISwapOpentalkDto,
  IUpdateOpentalkCycleDto,
  ScheduleCycle,
  ScheduleEvent,
} from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

export interface OpentalkSpreadsheetData {
  events: ScheduleEvent[];
  cycles: ScheduleCycle[];
}

export class OpentalkServerService extends BaseServerService {
  private readonly baseUrl = '/opentalk';

  // Cycle operations
  async createCycle(data: ICreateOpentalkCycleDto) {
    return this.post<ScheduleCycle>(`${this.baseUrl}/cycles`, data);
  }

  async getCycles(status?: string, email?: string) {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (email) params.email = email;

    const response = await this.get<ScheduleCycle[]>(
      `${this.baseUrl}/cycles`,
      params,
    );
    return response.data || [];
  }

  async getCycleById(id: number) {
    return this.get<ScheduleCycle>(`${this.baseUrl}/cycles/${id}`);
  }

  async updateCycle(id: number, data: IUpdateOpentalkCycleDto) {
    return this.put<ScheduleCycle>(`${this.baseUrl}/cycles/${id}`, data);
  }

  async deleteCycle(id: number) {
    return this.delete<void>(`${this.baseUrl}/cycles/${id}`);
  }

  // Event operations
  async createEvent(data: any) {
    return this.post<ScheduleEvent>(`${this.baseUrl}/events`, data);
  }

  async getEvents(query?: IOpentalkQueryDto) {
    const searchParams = new URLSearchParams();
    if (query?.cycleId) searchParams.set('cycleId', query.cycleId.toString());
    if (query?.status) searchParams.set('status', query.status);
    if (query?.participantId)
      searchParams.set('participantId', query.participantId.toString());

    const url = `${this.baseUrl}/events${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await this.get<ScheduleEvent[]>(url);
    return response.data || [];
  }

  async getEventsByCycle(cycleId: number) {
    const response = await this.get<ScheduleEvent[]>(
      `${this.baseUrl}/cycles/${cycleId}/events`,
    );
    return response.data || [];
  }

  async getEventById(id: number) {
    return this.get<ScheduleEvent>(`${this.baseUrl}/events/${id}`);
  }

  // TODO: Fix types - using any temporarily due to shared lib caching issue
  async updateEvent(id: number, data: any) {
    return this.put<ScheduleEvent>(`${this.baseUrl}/events/${id}`, data);
  }

  async deleteEvent(id: number) {
    return this.delete<void>(`${this.baseUrl}/events/${id}`);
  }

  // Additional operations
  async getSpreadsheetData(): Promise<OpentalkSpreadsheetData> {
    const response = await this.get<OpentalkSpreadsheetData>(
      `${this.baseUrl}/spreadsheet`,
    );
    return response.data;
  }

  async swapEvents(event1Id: number, event2Id: number): Promise<void> {
    const data: ISwapOpentalkDto = { event1Id, event2Id };
    await this.post<void>(`${this.baseUrl}/swap`, data);
  }

  async bulkAssignEvents(data: {
    cycleId: number;
    assignments: Array<{ eventId: number; participantIds: number[] }>;
  }): Promise<void> {
    await this.post<void>(`${this.baseUrl}/bulk-assign`, data);
  }

  async getConflicts(): Promise<any[]> {
    const response = await this.get<any[]>(`${this.baseUrl}/conflicts`);
    return response.data || [];
  }

  // Legacy compatibility methods
  async getScheduleEvents(): Promise<ScheduleEvent[]> {
    return this.getEvents();
  }
}

// Create a singleton instance
export const opentalkServerService = new OpentalkServerService();
