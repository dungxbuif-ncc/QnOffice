# Schedule Cron & Notification System

## Overview

Event-driven notification delivery system with centralized cron jobs for automated scheduling tasks. All times are in Asia/Bangkok (UTC+7) timezone.

## Architecture

### Centralized Cron Management

**CronModule**: Single location for all cron job definitions

- All `@Cron` decorators are defined in `CronService`
- Delegates execution to domain-specific services
- Provides unified logging and error handling
- Easy to view all scheduled tasks in one place

```
CronModule (Central) → CronService (@Cron decorators) → Domain Services (Business Logic)
                                    ↓
                          CleaningCronService
                          OpentalkCronService
```

### Notification Layer

**Event-Based Design**: Cron services emit events directly using EventEmitter2

```
Cron Services → EventEmitter2 → NotificationListener → Bot Integration (Future)
```

**Key Components**:

- **Cron Services**: Emit notification events directly
- **NotificationListener**: Handles events (currently logs, will integrate with bot)
- **NotificationEvent**: Enum of all notification types
- **Event Payloads**: Typed interfaces for each notification

## Cron Jobs

### Daily - Mark Completed Events (00:00 UTC+7)

**Both Cleaning & Opentalk**

- Marks all past events (eventDate < today) as COMPLETED
- Only updates ACTIVE events
- Runs in parallel for both schedule types

### Cleaning Schedule Crons

#### Morning Reminder (08:00 UTC+7)

- Sends reminder to participants with cleaning schedule TODAY
- Tags participants in channel
- Sends DM to participants

**Event**: `CLEANING_MORNING_REMINDER`

#### Afternoon Reminder (17:00 UTC+7)

- Thanks today's participants
- Reminds tomorrow's participants
- Tags both in channel

**Events**:

- `CLEANING_AFTERNOON_REMINDER` (today's participants)
- `CLEANING_NEXT_DAY_REMINDER` (tomorrow's participants)

### Opentalk Schedule Crons

#### Slide Submission Check (09:00 UTC+7)

- Checks `opentalk_slides` table for submission status
- Sends reminders based on days until event:
  - **7 days before**: Initial slide submission reminder
  - **3 days before**: Follow-up reminder if not submitted
  - **1 day before**: Final warning / overdue notice

**Events**:

- `OPENTALK_SLIDE_REMINDER` (7 days, 3 days)
- `OPENTALK_SLIDE_OVERDUE` (1 day)

## Notification Events

### Cleaning Events

```typescript
CleaningReminderPayload {
  eventId: number
  eventDate: string
  participantIds: number[]
  participantEmails: string[]
  type: 'morning' | 'afternoon' | 'nextday'
}
```

### Opentalk Events

```typescript
OpentalkSlideReminderPayload {
  eventId: number
  eventDate: string
  participantId: number
  participantEmail: string
  daysUntilEvent: number
  slideSubmitted: boolean
}
```

### Staff Change Events

```typescript
StaffChangePayload {
  staffId: number
  staffEmail: string
  type: 'onboarding' | 'offboarding'
  affectedSchedules: {
    type: 'cleaning' | 'opentalk'
    changes: string[]
  }[]
}
```

## Bot Integration (Future)

The `NotificationListener` currently logs all events. To integrate with bot:

1. Inject bot service into `NotificationListener`
2. Replace log statements with bot API calls
3. Format messages according to bot requirements
4. Handle DM and channel messages differently

Example:

```typescript
@OnEvent(NotificationEvent.CLEANING_MORNING_REMINDER)
async handleCleaningMorningReminder(payload: CleaningReminderPayload) {
  // Send to channel
  await this.botService.sendChannelMessage({
    channel: 'cleaning',
    message: `🧹 Good morning! Today's cleaning: ${payload.participantEmails.join(', ')}`
  });

  // Send DMs
  for (const email of payload.participantEmails) {
    await this.botService.sendDM(email, '🧹 Reminder: You have cleaning duty today!');
  }
}
```

## Database Schema Updates

### Opentalk Slides Table

**New Table**: `opentalk_slides`

Separate table for managing opentalk slide submissions:

```typescript
{
  id: number;
  eventId: number; // FK to schedule_events
  staffId: number; // FK to staff
  slideUrl: string(nullable); // URL to submitted slide
  status: SlideStatus; // PENDING, SUBMITTED, APPROVED, REJECTED
  topic: string(nullable); // Slide topic
  description: string(nullable);
  submittedAt: Date(nullable);
  reviewedAt: Date(nullable);
  reviewedBy: number(nullable); // FK to staff (HR/GDVP)
  reviewNote: string(nullable);
}
```

**Benefits**:

- Clean separation of slide data from event data
- Full audit trail (submitted, reviewed timestamps)
- Support for review workflow
- Can track multiple slide versions if needed

### Removed from schedule_events:

- `slideUrl` (moved to opentalk_slides)
- `slideStatus` (moved to opentalk_slides)

## Configuration

All cron jobs use:

- **Timezone**: `Asia/Bangkok` (UTC+7)
- **Cron Expressions**:
  - `0 0 * * *` - Daily midnight
  - `0 8 * * *` - Daily 8am
  - `0 9 * * *` - Daily 9am
  - `0 17 * * *` - Daily 5pm

## Files Created

```
apps/be/src/
├── cron/
│   ├── cron.module.ts                      # Centralized cron module
│   └── cron.service.ts                     # All @Cron decorators defined here
├── common/
│   ├── events/
│   │   └── notification.events.ts          # Event types & payloads
│   └── listeners/
│       └── notification.listener.ts        # Event handlers (bot integration point)
└── modules/schedule/
    ├── enties/
    │   └── opentalk-slide.entity.ts        # Opentalk slide table
    └── services/
        ├── cleaning-cron.service.ts        # Cleaning business logic (no @Cron)
        └── opentalk-cron.service.ts        # Opentalk business logic (no @Cron)
```

## Module Structure

```
AppModule
├── CronModule (imports ScheduleModule)
│   └── CronService (@Cron decorators)
│       ├── → CleaningCronService (business logic)
│       └── → OpentalkCronService (business logic)
└── ScheduleModule
    ├── EventEmitterModule
    ├── CleaningCronService (exported)
    └── OpentalkCronService (exported)
```

## Testing Crons

### Manual Testing

To test cron jobs without waiting, call methods directly through a test controller:

```typescript
@Controller('test-crons')
export class TestCronController {
  constructor(private readonly cronService: CronService) {}

  @Get('/mark-completed')
  async testMarkCompleted() {
    await this.cronService.markPastEventsCompleted();
    return 'Executed mark completed';
  }

  @Get('/cleaning-morning')
  async testCleaningMorning() {
    await this.cronService.sendCleaningMorningReminder();
    return 'Executed cleaning morning reminder';
  }

  @Get('/opentalk-slide-check')
  async testOpentalkSlideCheck() {
    await this.cronService.checkOpentalkSlideSubmission();
    return 'Executed opentalk slide check';
  }

  @Get('/cleaning-afternoon')
  async testCleaningAfternoon() {
    await this.cronService.sendCleaningAfternoonReminder();
    return 'Executed cleaning afternoon reminder';
  }
}
```

### View All Scheduled Crons

All cron jobs are defined in one place: `src/cron/cron.service.ts`

Current schedule:

- **00:00 UTC+7**: Mark past events completed (both cleaning & opentalk)
- **08:00 UTC+7**: Cleaning morning reminder
- **09:00 UTC+7**: Opentalk slide submission check
- **17:00 UTC+7**: Cleaning afternoon reminder + next day reminder

## Advantages of Centralized CronModule

1. **Single Source of Truth**: All cron schedules visible in one file
2. **Easier Maintenance**: Add/modify/remove crons in one place
3. **Unified Error Handling**: Centralized try-catch and logging
4. **Better Monitoring**: Easy to add metrics/monitoring around all crons
5. **Clean Separation**: Cron scheduling separate from business logic
6. **Testing**: Can easily test business logic without cron dependencies

## Next Steps

1. Create bot module/service
2. Update `NotificationListener` to call bot APIs
3. Add message templates for each notification type
4. Handle errors and retries for bot API calls
5. Add logging and monitoring
