import { ScheduleCycle, ScheduleEvent } from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

class CleaningServerService extends BaseServerService {
  private readonly baseUrl = '/cleaning';

  async getCycles(status?: string): Promise<ScheduleCycle[]> {
    const params = status ? { status } : {};
    const response = await this.get<ScheduleCycle[]>(
      `${this.baseUrl}/cycles`,
      params,
    );
    return response?.data || [];
  }

  async getCycleById(id: number): Promise<ScheduleCycle> {
    const response = await this.get<ScheduleCycle>(
      `${this.baseUrl}/cycles/${id}`,
    );
    return response?.data;
  }

  async getEvents(query: any = {}): Promise<ScheduleEvent[]> {
    const response = await this.get<ScheduleEvent[]>(
      `${this.baseUrl}/events`,
      query,
    );
    return response?.data || [];
  }

  async getEventsByCycle(cycleId: number): Promise<ScheduleEvent[]> {
    const response = await this.get<ScheduleEvent[]>(
      `${this.baseUrl}/cycles/${cycleId}/events`,
    );
    return response?.data || [];
  }

  async createCycle(data: any): Promise<ScheduleCycle> {
    const response = await this.post<ScheduleCycle>(
      `${this.baseUrl}/cycles`,
      data,
    );
    return response?.data;
  }

  async updateCycle(id: number, data: any): Promise<ScheduleCycle> {
    const response = await this.put<ScheduleCycle>(
      `${this.baseUrl}/cycles/${id}`,
      data,
    );
    return response?.data;
  }

  async deleteCycle(id: number): Promise<void> {
    await this.delete(`${this.baseUrl}/cycles/${id}`);
  }

  async createEvent(data: any): Promise<ScheduleEvent> {
    const response = await this.post<ScheduleEvent>(
      `${this.baseUrl}/events`,
      data,
    );
    return response?.data;
  }

  async updateEvent(id: number, data: any): Promise<ScheduleEvent> {
    const response = await this.put<ScheduleEvent>(
      `${this.baseUrl}/events/${id}`,
      data,
    );
    return response?.data;
  }

  async deleteEvent(id: number): Promise<void> {
    await this.delete(`${this.baseUrl}/events/${id}`);
  }

  async bulkAssignParticipants(data: any): Promise<any> {
    const response = await this.post<any>(`${this.baseUrl}/bulk-assign`, data);
    return response?.data;
  }

  async getSpreadsheetData(cycleId?: number): Promise<any> {
    const params = cycleId ? { cycleId } : {};
    const response = await this.get<any>(`${this.baseUrl}/spreadsheet`, params);
    return response?.data;
  }
}

export const cleaningServerService = new CleaningServerService();
