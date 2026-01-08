import { CreateCycleDto, ScheduleCycle } from '@qnoffice/shared';
import baseApi from './base-api';

class ScheduleClientService {
  private readonly baseUrl = '/api/schedules';

  async createCycle(data: CreateCycleDto) {
    return baseApi.post<ScheduleCycle>(`${this.baseUrl}/cycles`, data);
  }
}

export const scheduleClientService = new ScheduleClientService();
