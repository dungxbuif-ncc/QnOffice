import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { CycleStatus, EventStatus, ScheduleType, SearchOrder, StaffStatus } from '@qnoffice/shared';
import {
  NotificationEvent,
  OpentalkSlideReminderPayload,
} from '@src/common/events/notification.events';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import {
  getCurrentDateString,
  toDateString,
} from '@src/common/utils/date.utils';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import OpentalkSlideEntity from '@src/modules/opentalk/entities/opentalk-slide.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import { addDays, addMonths, startOfMonth, subDays } from 'date-fns';
import { Between, EntityManager, In, LessThan, Like, MoreThan, Repository } from 'typeorm';
import ScheduleCycleEntity from '../enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '../enties/schedule-event-participant.entity';
import ScheduleEventEntity from '../enties/schedule-event.entity';
import {
  CycleData,
  SchedulerConfig,
  SchedulingAlgorithm,
  Staff,
} from '../schedule.algorith';

@Injectable()
export class OpentalkCronService {
  constructor(
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(OpentalkSlideEntity)
    private readonly slideRepository: Repository<OpentalkSlideEntity>,
    @InjectRepository(ScheduleCycleEntity)
    private readonly cycleRepository: Repository<ScheduleCycleEntity>,
    @InjectRepository(StaffEntity)
    private readonly staffRepository: Repository<StaffEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly eventEmitter: EventEmitter2,
    private readonly appLogService: AppLogService,
  ) {}

  async markPastEventsCompleted(journeyId: string): Promise<void> {
    this.appLogService.journeyLog(
      journeyId,
      'Starting opentalk events completion process',
      'OpentalkCronService',
      { scheduleType: ScheduleType.OPENTALK },
    );

    const today = getCurrentDateString();
    const sevenDaysFromNow = addDays(new Date(today), 7)
      .toISOString()
      .split('T')[0];

    try {
      // Step 1: Find all ACTIVE events before today
      this.appLogService.stepLog(
        1,
        'Finding ACTIVE opentalk events before today',
        'OpentalkCronService',
        journeyId,
        { today },
      );

      const pastActiveEvents = await this.eventRepository.find({
        where: {
          type: ScheduleType.OPENTALK,
          eventDate: LessThan(today),
          status: EventStatus.ACTIVE,
        },
        order: {
          eventDate: 'ASC',
        },
      });

      this.appLogService.stepLog(
        2,
        `Found ${pastActiveEvents.length} past ACTIVE opentalk events`,
        'OpentalkCronService',
        journeyId,
        {
          count: pastActiveEvents.length,
          eventIds: pastActiveEvents.map((e) => e.id),
          eventDates: pastActiveEvents.map((e) => e.eventDate),
          eventTitles: pastActiveEvents.map((e) => e.title),
          oldestEventDate: pastActiveEvents[0]?.eventDate || null,
          newestEventDate:
            pastActiveEvents[pastActiveEvents.length - 1]?.eventDate || null,
          today,
        },
      );

      // Step 2: Mark past ACTIVE events as COMPLETED
      if (pastActiveEvents.length > 0) {
        this.appLogService.stepLog(
          3,
          'Marking past ACTIVE opentalk events as COMPLETED',
          'OpentalkCronService',
          journeyId,
          {
            eventsToUpdate: pastActiveEvents.length,
            eventIdsToUpdate: pastActiveEvents.map((e) => e.id),
            statusBefore: EventStatus.ACTIVE,
            statusAfter: EventStatus.COMPLETED,
          },
        );

        const result = await this.eventRepository.update(
          {
            type: ScheduleType.OPENTALK,
            eventDate: LessThan(today),
            status: EventStatus.ACTIVE,
          },
          {
            status: EventStatus.COMPLETED,
          },
        );

        this.appLogService.stepLog(
          4,
          `Marked ${result.affected ?? 0} opentalk events as COMPLETED`,
          'OpentalkCronService',
          journeyId,
          {
            affectedCount: result.affected ?? 0,
            expectedCount: pastActiveEvents.length,
            matched: (result.affected ?? 0) === pastActiveEvents.length,
            updateSuccess: (result.affected ?? 0) > 0,
          },
        );
      } else {
        this.appLogService.stepLog(
          3,
          'No past ACTIVE opentalk events to mark as COMPLETED',
          'OpentalkCronService',
          journeyId,
          { today, reason: 'No events found before today' },
        );
      }

      // Step 3: Find the next PENDING event within 7 days to activate
      this.appLogService.stepLog(
        5,
        'Finding next PENDING opentalk event within 7 days to activate',
        'OpentalkCronService',
        journeyId,
        { fromDate: today, toDate: sevenDaysFromNow },
      );

      const nextPendingEvent = await this.eventRepository.findOne({
        where: {
          type: ScheduleType.OPENTALK,
          eventDate: Between(today, sevenDaysFromNow),
          status: EventStatus.PENDING,
        },
        order: {
          eventDate: 'ASC',
        },
      });

      // Step 4: Activate the next PENDING event within 7 days
      if (nextPendingEvent) {
        const daysFromToday = Math.ceil(
          (new Date(nextPendingEvent.eventDate).getTime() -
            new Date(today).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        this.appLogService.stepLog(
          6,
          'Activating next PENDING opentalk event',
          'OpentalkCronService',
          journeyId,
          {
            eventId: nextPendingEvent.id,
            eventDate: nextPendingEvent.eventDate,
            title: nextPendingEvent.title,
            cycleId: nextPendingEvent.cycleId,
            daysFromToday,
            withinSevenDays: daysFromToday <= 7,
            searchWindow: {
              from: today,
              to: sevenDaysFromNow,
              windowDays: 7,
            },
            statusBefore: EventStatus.PENDING,
            statusAfter: EventStatus.ACTIVE,
          },
        );

        await this.eventRepository.update(
          { id: nextPendingEvent.id },
          { status: EventStatus.ACTIVE },
        );

        this.appLogService.stepLog(
          7,
          `Successfully activated opentalk event ${nextPendingEvent.id}`,
          'OpentalkCronService',
          journeyId,
          {
            eventId: nextPendingEvent.id,
            eventDate: nextPendingEvent.eventDate,
            title: nextPendingEvent.title,
            newStatus: EventStatus.ACTIVE,
            activatedAt: new Date().toISOString(),
            daysUntilEvent: daysFromToday,
          },
        );
      } else {
        this.appLogService.stepLog(
          6,
          'No PENDING opentalk events found within 7 days to activate',
          'OpentalkCronService',
          journeyId,
          {
            searchRange: `${today} to ${sevenDaysFromNow}`,
            searchCriteria: {
              type: ScheduleType.OPENTALK,
              status: EventStatus.PENDING,
              dateRange: {
                from: today,
                to: sevenDaysFromNow,
              },
            },
            reason: 'No PENDING events found within 7-day window',
            windowDays: 7,
          },
        );
      }

      this.appLogService.journeyLog(
        journeyId,
        '✅ Successfully completed opentalk events process',
        'OpentalkCronService',
        {
          completedCount: pastActiveEvents.length,
          activatedEvent: nextPendingEvent?.id || null,
          activatedEventDate: nextPendingEvent?.eventDate || null,
          executionDate: today,
          searchWindow: {
            from: today,
            to: sevenDaysFromNow,
          },
          totalStepsExecuted: nextPendingEvent ? 7 : 6,
        },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Error in opentalk events completion process',
        error.stack,
        'OpentalkCronService',
        { error: error.message },
      );
    }
  }

  async checkSlideSubmission(journeyId: string): Promise<void> {
    const today = getCurrentDateString();
    const sevenDaysFromNow = addDays(new Date(today), 7)
      .toISOString()
      .split('T')[0];

    // ... logic ...
    try {
      // Find all ACTIVE Opentalk events in the next 7 days
      const upcomingEvents = await this.eventRepository.find({
        where: {
          type: ScheduleType.OPENTALK,
          eventDate: Between(today, sevenDaysFromNow),
          status: EventStatus.ACTIVE,
        },
        relations: ['eventParticipants', 'eventParticipants.staff'],
        order: {
          eventDate: 'ASC',
        },
      });

      this.appLogService.journeyLog(
        journeyId,
        `Checking slide submissions for ${upcomingEvents.length} upcoming Opentalk events`,
        'OpentalkCronService',
        {
          eventCount: upcomingEvents.length,
          dateRange: { from: today, to: sevenDaysFromNow },
        },
      );

      if (upcomingEvents.length === 0) {
        this.appLogService.journeyLog(
          journeyId,
          'No upcoming Opentalk events found within 7 days',
          'OpentalkCronService',
          { today, sevenDaysFromNow },
        );
        return;
      }

      // Get all event IDs to check for slides
      const eventIds = upcomingEvents.map((e) => e.id);

      // Fetch all slides for these events
      const slides = await this.slideRepository.find({
        where: {
          eventId: In(eventIds),
        },
      });

      // Create a map of eventId -> slide for quick lookup
      const slideMap = new Map(slides.map((s) => [s.eventId, s]));

      // Reminder thresholds: 7, 5, 3, 1 days before event
      const reminderDays = [7, 5, 3, 1];

      let totalReminders = 0;

      for (const event of upcomingEvents) {
        const eventDate = new Date(event.eventDate);
        const todayDate = new Date(today);
        const daysUntilEvent = Math.ceil(
          (eventDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Check if today matches a reminder threshold
        if (!reminderDays.includes(daysUntilEvent)) {
          continue;
        }

        // Check if slide has been submitted
        const slide = slideMap.get(event.id);
        const hasSlide = !!slide;

        const participants = event.eventParticipants || [];

        if (participants.length > 0) {
          this.appLogService.stepLog(
            1,
            `Checking event ${event.id} (${daysUntilEvent} days before) - Slide: ${hasSlide ? 'YES' : 'NO'}`,
            'OpentalkCronService',
            journeyId,
            {
              eventId: event.id,
              eventDate: event.eventDate,
              daysUntilEvent,
              participantCount: participants.length,
              hasSlide,
              slideStatus: slide?.status || null,
            },
          );

          // Emit event for each participant
          for (const participant of participants) {
            const staff = participant.staff;
            const mezonId = staff?.userId;
            const email = staff?.email;

            if (mezonId && email) {
              const payload: OpentalkSlideReminderPayload = {
                eventId: event.id,
                eventDate: event.eventDate,
                participant: {
                  userId: mezonId,
                  username: email.split('@')[0],
                },
                daysUntilEvent,
                slideSubmitted: hasSlide,
                journeyId: journeyId,
              };

              this.eventEmitter.emit(
                NotificationEvent.OPENTALK_SLIDE_REMINDER,
                payload,
              );

              totalReminders++;

              this.appLogService.stepLog(
                2,
                `Emitted slide reminder for ${email}`,
                'OpentalkCronService',
                journeyId,
                {
                  eventId: event.id,
                  staffId: participant.staffId,
                  email,
                  mezonId,
                  daysUntilEvent,
                  slideSubmitted: hasSlide,
                },
              );
            }
          }
        }
      }

      this.appLogService.journeyLog(
        journeyId,
        `✅ Successfully completed slide check - sent ${totalReminders} reminders`,
        'OpentalkCronService',
        {
          totalEvents: upcomingEvents.length,
          totalReminders,
          dateRange: { from: today, to: sevenDaysFromNow },
        },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Error checking slide submissions',
        error.stack,
        'OpentalkCronService',
        { error: error.message },
      );
    }
  }
  async handleAutomaticCycleCreation(journeyId: string): Promise<void> {
    this.appLogService.journeyLog(
      journeyId,
      'Checking if new opentalk cycle needs to be created',
      'OpentalkCronService',
    );

    try {
      const currentCycle = await this.cycleRepository.findOne({
        where: { type: ScheduleType.OPENTALK, status: CycleStatus.ACTIVE },
        relations: ['events'],
        order: { id: SearchOrder.DESC },
      });

      if (!currentCycle || currentCycle.events.length === 0) {
        this.appLogService.journeyLog(
          journeyId,
          'No active cycle found or cycle has no events. Skipping auto-creation.',
          'OpentalkCronService',
        );
        return;
      }

      const sortedEvents = currentCycle.events.sort((a, b) =>
        a.eventDate.localeCompare(b.eventDate),
      );
      const lastEvent = sortedEvents[sortedEvents.length - 1];
      const lastEventDate = new Date(lastEvent.eventDate);
      const today = new Date(getCurrentDateString());

      const sevenDaysBeforeEnd = subDays(lastEventDate, 7);

      if (today < sevenDaysBeforeEnd) {
        this.appLogService.journeyLog(
          journeyId,
          'Current cycle is not near completion. Skipping.',
          'OpentalkCronService',
          {
            lastEventDate: lastEvent.eventDate,
            checkDate: getCurrentDateString(),
            triggerDate: toDateString(sevenDaysBeforeEnd),
          },
        );
        return;
      }

      const startOfNextMonth = startOfMonth(addMonths(lastEventDate, 1));
      const nextMonthStr = `${startOfNextMonth.getMonth() + 1}/${startOfNextMonth.getFullYear()}`;

      const existingNextCycle = await this.cycleRepository.findOne({
        where: {
          type: ScheduleType.OPENTALK,
          name: Like(`%${nextMonthStr}%`),
        },
      });

      const newerCycleEncoded = await this.cycleRepository.findOne({
        where: {
          type: ScheduleType.OPENTALK,
          id: MoreThan(currentCycle.id),
        },
      });

      if (newerCycleEncoded || existingNextCycle) {
        this.appLogService.journeyLog(
          journeyId,
          'Next cycle likely already exists. Skipping.',
          'OpentalkCronService',
          {
            newerCycleId: newerCycleEncoded?.id,
            existingNextCycleId: existingNextCycle?.id,
          },
        );
        return;
      }

      this.appLogService.journeyLog(
        journeyId,
        ' Triggering new opentalk cycle creation!',
        'OpentalkCronService',
      );

      await this.createNextCycle(currentCycle, journeyId);
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Error in automatic cycle creation check',
        error.stack,
        'OpentalkCronService',
        { error: error.message },
      );
    }
  }

  private async createNextCycle(
    previousCycleEntity: ScheduleCycleEntity,
    journeyId: string,
  ): Promise<void> {
    const staff = await this.staffRepository.find({
      where: { status: StaffStatus.ACTIVE },
      relations: ['user'],
    });

    if (staff.length === 0) {
      this.appLogService.journeyError(
        journeyId,
        '❌ No active staff found',
        'OpentalkCronService',
      );
      return; 
    }
    const algorithmStaff: Staff[] = staff.map((s) => ({
      id: s.id,
      username: s.email ||  `staff_${s.id}`,
    }));

    const previousEvents = await this.eventRepository.find({
      where: {
        cycleId: previousCycleEntity.id,
        type: ScheduleType.OPENTALK,
      },
      relations: ['eventParticipants'],
      order: { eventDate: 'ASC' },
    });

    const previousCycleData: CycleData = {
      id: previousCycleEntity.id,
      events: previousEvents.map((e) => ({
        date: e.eventDate,
        staffIds: e.eventParticipants.map((p) => p.staffId),
      })),
    };

    const lastEventDate = new Date(
      previousEvents[previousEvents.length - 1].eventDate,
    );
    const startDate = startOfMonth(addDays(lastEventDate, 1));
    const endDate = addMonths(startDate, 1); 

    const holidays = await this.holidayRepository.find({
      where: {
        date: Between(
          toDateString(startDate),
          toDateString(addMonths(endDate, 12)), 
        ),
      },
    });

    const config: SchedulerConfig = {
      type: ScheduleType.OPENTALK,
      startDate: toDateString(startDate),
      slotSize: 1,
      holidays: holidays.map((h) =>
        typeof h.date === 'string' ? h.date : toDateString(h.date),
      ),
    };

    this.appLogService.stepLog(
      1,
      `Generating opentalk schedule for ${toDateString(startDate)}`,
      'OpentalkCronService',
      journeyId,
      { config },
    );

    const schedule = SchedulingAlgorithm.generateNewCycle(
      algorithmStaff,
      previousCycleData,
      config,
    );
this.appLogService.stepLog(
      2,
      `Generated opentalk schedule for ${toDateString(startDate)}`,
      'OpentalkCronService',
      journeyId,
      { schedule },
    );  
    await this.entityManager.transaction(async (manager) => {
      const newCycle = manager.create(ScheduleCycleEntity, {
        name: `OpenTalk tháng ${startDate.getMonth() + 1}/${startDate.getFullYear()}`,
        type: ScheduleType.OPENTALK,
        description: `Auto-generated schedule for ${startDate.getMonth() + 1}/${startDate.getFullYear()}`,
        status: CycleStatus.DRAFT,
      });

      this.appLogService.stepLog(
        3,
        `Creating new cycle for ${startDate.getMonth() + 1}/${startDate.getFullYear()}`,
        'OpentalkCronService',
        journeyId,
        { cycleName: newCycle.name },
      );

      const savedCycle = await manager.save(ScheduleCycleEntity, newCycle);

      // Create events with participants in memory
      const events = schedule.map((scheduleEvent, i) => {
        const assignedStaffId = scheduleEvent.staffIds[0];
        const assignedStaff = staff.find((s) => s.id === assignedStaffId);

        const eventTitle = `OpenTalk hàng tuần #${i + 1}`;
        const presenterInfo = assignedStaff
          ? assignedStaff.email || assignedStaff.email 
          : 'Không rõ'

        const event = manager.create(ScheduleEventEntity, {
          title: eventTitle,
          type: ScheduleType.OPENTALK,
          notes: `Weekly Opentalk - Diễn giả: ${presenterInfo}`,
          eventDate: scheduleEvent.date,
          status: EventStatus.PENDING,
          cycle: savedCycle,
          ...(scheduleEvent.staffIds.length > 0 && {
            eventParticipants: scheduleEvent.staffIds.map((staffId) =>
              manager.create(ScheduleEventParticipantEntity, { staffId }),
            ),
          }),
        });

        return event;
      });

      this.appLogService.stepLog(
        4,
        `Creating ${events.length} events (batch save with participant cascade)`,
        'OpentalkCronService',
        journeyId,
        { eventCount: events.length },
      );

      await manager.save(ScheduleEventEntity, events);

      this.appLogService.journeyLog(
        journeyId,
        `✅ Created new opentalk cycle ${savedCycle.name} with ${events.length} events`,
        'OpentalkCronService',
        { cycleId: savedCycle.id },
      );
    });
  }
}
