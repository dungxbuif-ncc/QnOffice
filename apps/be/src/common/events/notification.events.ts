export enum NotificationEvent {
  CLEANING_MORNING_REMINDER = 'notification.cleaning.morning.reminder',
  CLEANING_AFTERNOON_REMINDER = 'notification.cleaning.afternoon.reminder',
  CLEANING_NEXT_DAY_REMINDER = 'notification.cleaning.nextday.reminder',
  OPENTALK_SLIDE_REMINDER = 'notification.opentalk.slide.reminder',
  OPENTALK_SLIDE_OVERDUE = 'notification.opentalk.slide.overdue',
  STAFF_ONBOARDING = 'notification.staff.onboarding',
  STAFF_OFFBOARDING = 'notification.staff.offboarding',
  ORDER_CREATED = 'notification.order.created',
  ORDER_PAYMENT_REMINDER = 'notification.order.payment.reminder',
  USER_MESSAGE = 'notification.user.message',
}

export interface EventParticipant {
  userId: string;
  username: string;
}

export interface CleaningReminderPayload {
  eventId: number;
  eventDate: string;
  participants: EventParticipant[];
  type: 'morning' | 'afternoon' | 'nextday';
  journeyId: string;
}

export interface OpentalkSlideReminderPayload {
  eventId: number;
  eventDate: string;
  participant: EventParticipant;
  daysUntilEvent: number;
  slideSubmitted: boolean;
  journeyId: string;
}

export interface StaffChangePayload {
  staffId: number;
  staffEmail: string;
  type: 'onboarding' | 'offboarding';
  affectedSchedules: {
    type: 'cleaning' | 'opentalk';
    changes: string[];
  }[];
  journeyId: string;
}

export interface OrderPaymentReminderPayload {
  date: string;
  channelId: string;
  orders: {
    userId: string;
    username: string;
    content: string;
  }[];
  journeyId: string;
}

export interface UserMessagePayload {
  mezonId: string;
  name?: string;
  avatar?: string;
}
