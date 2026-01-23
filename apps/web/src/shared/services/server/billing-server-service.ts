import { BaseServerService } from './base-server-service';

export interface Order {
  id: string;
  content: string;
  userMezonId: string;
  createdAt: Date;
  user?: {
    name?: string;
    email?: string;
  };
}

export interface Billing {
  id: number;
  userMezonId: string;
  channelId: string;
  date: string;
  createdAt: Date;
  user?: {
    name?: string;
    email?: string;
  };
  orders: Order[];
}

class BillingServerService extends BaseServerService {
  async getMyBillings(month?: string): Promise<Billing[]> {
    const response = await this.get<Billing[]>('/billings/my-billings', {
      params: { month },
    });
    return response.data;
  }
}

export const billingServerService = new BillingServerService();
