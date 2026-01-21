import { GroupedOrder } from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

class OrderServerService extends BaseServerService {
  async getGrouped(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<GroupedOrder[]> {
    const filteredParams: Record<string, string> = {};
    if (params?.startDate) filteredParams.startDate = params.startDate;
    if (params?.endDate) filteredParams.endDate = params.endDate;
    
    const query = new URLSearchParams(filteredParams).toString();
    const url = query ? `/orders?${query}` : '/orders';
    const response = await this.get<GroupedOrder[]>(url);
    return response.data;
  }
}

export const orderServerService = new OrderServerService();
