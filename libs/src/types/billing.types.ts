import { Order } from './order.types';

export interface Billing {
  id: number;
  userMezonId: string;
  channelId: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name?: string;
    email?: string;
    mezonId?: string;
  };
  orders: Order[];
}
