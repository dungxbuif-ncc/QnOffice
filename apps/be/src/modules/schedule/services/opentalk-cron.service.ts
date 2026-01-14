import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import {
  CycleStatus,
  EventStatus,
  ScheduleType,
  StaffStatus,
} from '@qnoffice/shared';
import {
  NotificationEvent,
  OpentalkSlideReminderPayload,
} from '@src/common/events/notification.events';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import {
  fromDateString,
  getCurrentDateString,
  getNextOpentalkDate,
  toDateString,
} from '@src/common/utils/date.utils';
import { formatVn, nowVn } from '@src/common/utils/time.util';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import OpentalkSlideEntity from '@src/modules/opentalk/entities/opentalk-slide.entity';
import { OpentalkService } from '@src/modules/opentalk/opentalk.service';
import StaffEntity from '@src/modules/staff/staff.entity';
import { addDays, addMonths, differenceInCalendarDays } from 'date-fns';
import { Between, EntityManager, In, LessThan, Not, Repository } from 'typeorm';
import ScheduleCycleEntity from '../enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '../enties/schedule-event-participant.entity';
import ScheduleEventEntity from '../enties/schedule-event.entity';
import {
  CycleData,
  SchedulerConfig,
  SchedulingAlgorithm,
  Staff,
} from '../schedule.algorith';
import { getCycleTriggerStatus, getNextCycleInfo } from '../schedule.utils';

@Injectable()
export class OpentalkCronService {
  constructor(
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(OpentalkSlideEntity)
    private readonly slideRepository: Repository<OpentalkSlideEntity>,
    @InjectRepository(StaffEntity)
    private readonly staffRepository: Repository<StaffEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly opentalkService: OpentalkService,
    private readonly appLogService: AppLogService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async markPastEventsCompleted(journeyId: string): Promise<void> {
    this.appLogService.journeyLog(
      journeyId,
      'Starting opentalk events completion process',
      'OpentalkCronService',
      { scheduleType: ScheduleType.OPENTALK },
    );

    const today = getCurrentDateString();

    try {
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
          status: Not(EventStatus.COMPLETED),
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

      if (pastActiveEvents.length > 0) {
        this.appLogService.stepLog(
          3,
          'Marking past ACTIVE opentalk events as COMPLETED',
          'OpentalkCronService',
          journeyId,
          {
            eventsToUpdate: pastActiveEvents.length,
            eventIdsToUpdate: pastActiveEvents.map((e) => e.id),
          },
        );

        const result = await this.eventRepository.update(
          {
            id: In(pastActiveEvents.map((e) => e.id)),
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
    const sevenDaysFromNow = toDateString(addDays(fromDateString(today), 7));

    try {
      const reminderDays = [1, 3, 5, 7];
      const upcomingEvents = await this.eventRepository.find({
        where: {
          type: ScheduleType.OPENTALK,
          eventDate: Between(today, sevenDaysFromNow),
        },
        relations: ['eventParticipants', 'eventParticipants.staff'],
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

      const eventIds = upcomingEvents.map((e) => e.id);
      const slides = await this.slideRepository.find({
        where: {
          eventId: In(eventIds),
        },
      });

      const slideMap = new Map(slides.map((s) => [s.eventId, s]));
      let totalReminders = 0;

      for (const event of upcomingEvents) {
        const daysUntilEvent = differenceInCalendarDays(
          fromDateString(event.eventDate),
          fromDateString(today),
        );
        if (!reminderDays.includes(daysUntilEvent)) {
          continue;
        }
        const slide = slideMap.get(event.id);
        const hasSlide = !!slide;
        const participants = event.eventParticipants || [];

        participants.forEach((participant) => {
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
        });
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
      const todayString = formatVn(nowVn(), 'yyyy-MM-dd');
      const activeCycle = await this.opentalkService.getActiveCycle();
      if (!activeCycle) {
        this.appLogService.journeyLog(
          journeyId,
          'No active opentalk cycle found for today. Skipping.',
          'OpentalkCronService',
        );
        return;
      }
      const eventDates = activeCycle.events.map((e) => e.eventDate).sort();
      const lastEventDateStr = eventDates[eventDates.length - 1];
      const { shouldTrigger, daysUntilEnd } = getCycleTriggerStatus(
        lastEventDateStr,
        todayString,
      );

      if (!shouldTrigger) {
        this.appLogService.journeyLog(
          journeyId,
          `Current opentalk schedule is not near completion (${daysUntilEnd} days left). Skipping.`,
          'OpentalkCronService',
          {
            cycleName: activeCycle.name,
            lastEventDate: lastEventDateStr,
            checkDate: todayString,
            daysUntilEnd,
          },
        );
        return;
      }

      this.appLogService.journeyLog(
        journeyId,
        'Triggering new opentalk cycle creation!',
        'OpentalkCronService',
      );

      await this.createNextCycle(activeCycle, journeyId);
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
      username: s.email || `staff_${s.id}`,
    }));

    const previousEvents = previousCycleEntity.events;

    const previousCycleData: CycleData = {
      id: previousCycleEntity.id,
      events: previousEvents.map((e) => ({
        date: e.eventDate,
        staffIds: e.eventParticipants.map((p) => p.staffId),
      })),
    };

    const lastEventDateStr =
      previousEvents[previousEvents.length - 1].eventDate;
    const lastEventDate = fromDateString(lastEventDateStr);

    const { startDate, cycleName, description } = getNextCycleInfo(
      lastEventDateStr,
      ScheduleType.OPENTALK,
    );

    const holidays = await this.holidayRepository.find({
      where: {
        date: Between(
          toDateString(startDate),
          toDateString(addMonths(startDate, 12)),
        ),
      },
    });

    const holidaysStr = holidays.map((h) =>
      typeof h.date === 'string' ? h.date : toDateString(h.date),
    );

    const nextValidStartDate = getNextOpentalkDate(lastEventDate, holidaysStr);

    const config: SchedulerConfig = {
      type: ScheduleType.OPENTALK,
      startDate: toDateString(nextValidStartDate),
      slotSize: 1,
      holidays: holidaysStr,
    };

    this.appLogService.stepLog(
      1,
      `Generating opentalk schedule for ${toDateString(nextValidStartDate)}`,
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
        name: cycleName,
        type: ScheduleType.OPENTALK,
        description,
        status: CycleStatus.DRAFT,
      });

      this.appLogService.stepLog(
        3,
        `Creating new cycle for ${cycleName}`,
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
          : 'Không rõ';

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
