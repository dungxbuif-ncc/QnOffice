import { GroupedOrder } from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

class OrderServerService extends BaseServerService {
  async getGrouped(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<GroupedOrder[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const response = await this.get<GroupedOrder[]>(`/orders?${query}`);
    return response.data;
  }
}

export const orderServerService = new OrderServerService();
