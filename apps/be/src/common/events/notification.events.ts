export enum NotificationEvent {
  CLEANING_MORNING_REMINDER = 'notification.cleaning.morning.reminder',
  CLEANING_AFTERNOON_REMINDER = 'notification.cleaning.afternoon.reminder',
  CLEANING_NEXT_DAY_REMINDER = 'notification.cleaning.nextday.reminder',
  OPENTALK_SLIDE_REMINDER = 'notification.opentalk.slide.reminder',
  OPENTALK_SLIDE_OVERDUE = 'notification.opentalk.slide.overdue',
  STAFF_ONBOARDING = 'notification.staff.onboarding',
  STAFF_OFFBOARDING = 'notification.staff.offboarding',
}

export interface CleaningReminderPayload {
  eventId: number;
  eventDate: string;
  participantIds: number[];
  participantEmails: string[];
  type: 'morning' | 'afternoon' | 'nextday';
}

export interface OpentalkSlideReminderPayload {
  eventId: number;
  eventDate: string;
  participantId: number;
  participantEmail: string;
  daysUntilEvent: number;
  slideSubmitted: boolean;
}

export interface StaffChangePayload {
  staffId: number;
  staffEmail: string;
  type: 'onboarding' | 'offboarding';
  affectedSchedules: {
    type: 'cleaning' | 'opentalk';
    changes: string[];
  }[];
}
