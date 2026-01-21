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
}

export interface OrderSession {
  orders: Order[];
}

export interface GroupedOrder {
  channelId: string;
  sessions: OrderSession[];
}

export interface OrderGroupQuery {
  startDate?: string;
  endDate?: string;
}
