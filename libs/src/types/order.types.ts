export interface Order {
  id: string;
  userMezonId: string;
  content: string;
  messageId: string;
  channelId?: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
  user?: any;
  billingId?: number;
  isPaid?: boolean;
  amount?: number;
}

export interface OrderSession {
  orders: Order[];
  billingId?: number;
  billingOwner?: string;
  billingDate?: string;
}

export interface GroupedOrder {
  channelId: string;
  sessions: OrderSession[];
}

export interface OrderGroupQuery {
  startDate?: string;
  endDate?: string;
}
