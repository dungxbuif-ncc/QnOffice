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
  CleaningReminderPayload,
  NotificationEvent,
} from '@src/common/events/notification.events';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import {
  fromDateString,
  getCurrentDateString,
  getNextCleaningDate,
  toDateString,
} from '@src/common/utils/date.utils';
import { formatVn, nowVn } from '@src/common/utils/time.util';
import { CleaningService } from '@src/modules/cleaning/cleaning.service';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import { addDays, addMonths } from 'date-fns';
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
export class CleaningCronService {
  constructor(
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(StaffEntity)
    private readonly staffRepository: Repository<StaffEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly cleaningService: CleaningService,
    private readonly eventEmitter: EventEmitter2,
    private readonly appLogService: AppLogService,
  ) {}

  async markPastEventsCompleted(journeyId: string): Promise<void> {
    this.appLogService.journeyLog(
      journeyId,
      'Starting cleaning events completion process',
      'CleaningCronService',
      { scheduleType: ScheduleType.CLEANING },
    );

    const today = getCurrentDateString();

    try {
      this.appLogService.stepLog(
        1,
        'Finding ACTIVE cleaning events before today',
        'CleaningCronService',
        journeyId,
        { today },
      );

      const pastActiveEvents = await this.eventRepository.find({
        where: {
          type: ScheduleType.CLEANING,
          eventDate: LessThan(today),
          status: Not(EventStatus.COMPLETED),
        },
      });

      this.appLogService.stepLog(
        2,
        `Found ${pastActiveEvents.length} past ACTIVE cleaning events`,
        'CleaningCronService',
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
          'Marking past ACTIVE events as COMPLETED',
          'CleaningCronService',
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
          `Marked ${result.affected ?? 0} cleaning events as COMPLETED`,
          'CleaningCronService',
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
          'No past ACTIVE cleaning events to mark as COMPLETED',
          'CleaningCronService',
          journeyId,
          { today, reason: 'No events found before today' },
        );
      }

      this.appLogService.stepLog(
        5,
        'Finding next PENDING cleaning event to activate',
        'CleaningCronService',
        journeyId,
        { fromDate: today },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Error in cleaning events completion process',
        error.stack,
        'CleaningCronService',
        { error: error.message },
      );
    }
  }

  async sendMorningReminder(journeyId: string): Promise<void> {
    this.appLogService.journeyLog(
      journeyId,
      'Starting cleaning morning reminder process',
      'CleaningCronService',
      { reminderType: 'morning', scheduleType: ScheduleType.CLEANING },
    );
    const today = getCurrentDateString();
    try {
      this.appLogService.stepLog(
        1,
        "Finding today's ACTIVE cleaning events",
        'CleaningCronService',
        journeyId,
        { today },
      );

      const todayEvents = await this.eventRepository.find({
        where: {
          type: ScheduleType.CLEANING,
          eventDate: today,
        },
        relations: ['eventParticipants', 'eventParticipants.staff'],
      });

      this.appLogService.stepLog(
        2,
        `Found ${todayEvents.length} cleaning events for today`,
        'CleaningCronService',
        journeyId,
        {
          eventCount: todayEvents.length,
          eventIds: todayEvents.map((e) => e.id),
          today,
        },
      );

      let totalParticipants = 0;
      const payloads: CleaningReminderPayload[] = todayEvents
        .map((event) => {
          const eventParticipants = event.eventParticipants || [];

          const participants = eventParticipants.map((p) => ({
            userId: p.staff.userId || '',
            username: p.staff.email.split('@')[0],
          }));

          if (!participants.length) {
            return null;
          }

          totalParticipants += participants.length;
          return {
            eventId: event.id,
            eventDate: event.eventDate,
            participants,
            type: 'morning',
            journeyId: journeyId,
          };
        })
        .filter(Boolean) as CleaningReminderPayload[];

      if (payloads.length > 0) {
        this.appLogService.stepLog(
          3,
          `Emitting morning reminders for ${payloads.length} events`,
          'CleaningCronService',
          journeyId,
          {
            eventCount: payloads.length,
            totalParticipants,
          },
        );

        payloads.forEach((payload) => {
          this.eventEmitter.emit(
            NotificationEvent.CLEANING_MORNING_REMINDER,
            payload,
          );
        });
      }

      this.appLogService.journeyLog(
        journeyId,
        `✅ Successfully sent morning reminders for ${payloads.length} events`,
        'CleaningCronService',
        {
          totalEvents: todayEvents.length,
          eventsWithParticipants: payloads.length,
          totalParticipants,
          today,
        },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Error sending morning reminders',
        error.stack,
        'CleaningCronService',
        { error: error.message, today },
      );
    }
  }

  async sendAfternoonReminder(journeyId: string): Promise<void> {
    this.appLogService.journeyLog(
      journeyId,
      'Starting cleaning afternoon reminder process',
      'CleaningCronService',
      { reminderType: 'afternoon', scheduleType: ScheduleType.CLEANING },
    );

    const today = getCurrentDateString();

    try {
      this.appLogService.stepLog(
        1,
        "Finding today's ACTIVE cleaning events for afternoon reminder",
        'CleaningCronService',
        journeyId,
        { today },
      );

      const todayEvents = await this.eventRepository.find({
        where: {
          type: ScheduleType.CLEANING,
          eventDate: today,
        },
        relations: ['eventParticipants', 'eventParticipants.staff'],
      });

      this.appLogService.stepLog(
        2,
        `Found ${todayEvents.length} cleaning events for today`,
        'CleaningCronService',
        journeyId,
        {
          eventCount: todayEvents.length,
          eventIds: todayEvents.map((e) => e.id),
          today,
        },
      );

      const payloads: CleaningReminderPayload[] = [];
      let totalParticipants = 0;
      todayEvents.forEach((event) => {
        const eventParticipants = event.eventParticipants || [];
        const participants = eventParticipants.map((p) => ({
          userId: p.staff.userId || '',
          username: p.staff.email.split('@')[0],
        }));
        if (participants.length > 0) {
          totalParticipants += participants.length;
          payloads.push({
            eventId: event.id,
            eventDate: event.eventDate,
            participants,
            type: 'afternoon',
            journeyId: journeyId,
          });
        }
      });

      if (payloads.length > 0) {
        this.appLogService.stepLog(
          3,
          `Emitting afternoon reminders for ${payloads.length} events`,
          'CleaningCronService',
          journeyId,
          {
            eventCount: payloads.length,
            totalParticipants,
          },
        );

        payloads.forEach((payload) => {
          this.eventEmitter.emit(
            NotificationEvent.CLEANING_AFTERNOON_REMINDER,
            payload,
          );
        });
      }

      this.appLogService.journeyLog(
        journeyId,
        `✅ Successfully sent afternoon reminders for ${payloads.length} events`,
        'CleaningCronService',
        {
          today: {
            date: today,
            totalEvents: todayEvents.length,
            eventsWithParticipants: payloads.length,
            totalParticipants: totalParticipants,
          },
        },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Error sending afternoon reminders',
        error.stack,
        'CleaningCronService',
        { error: error.message, today },
      );
    }
  }

  async sendNextDayReminder(journeyId: string): Promise<void> {
    this.appLogService.journeyLog(
      journeyId,
      'Starting cleaning next day reminder process',
      'CleaningCronService',
      { reminderType: 'nextday', scheduleType: ScheduleType.CLEANING },
    );
    const today = getCurrentDateString();
    const tomorrow = toDateString(addDays(fromDateString(today), 1));
    try {
      this.appLogService.stepLog(
        1,
        "Finding tomorrow's ACTIVE cleaning events for next day reminder",
        'CleaningCronService',
        journeyId,
        { tomorrow },
      );

      const tomorrowEvents = await this.eventRepository.find({
        where: {
          type: ScheduleType.CLEANING,
          eventDate: tomorrow,
        },
        relations: ['eventParticipants', 'eventParticipants.staff'],
      });

      this.appLogService.stepLog(
        2,
        `Found ${tomorrowEvents.length} cleaning events for tomorrow`,
        'CleaningCronService',
        journeyId,
        {
          eventCount: tomorrowEvents.length,
          eventIds: tomorrowEvents.map((e) => e.id),
          tomorrow,
        },
      );

      const payloads: CleaningReminderPayload[] = [];
      let totalParticipants = 0;

      tomorrowEvents.forEach((event) => {
        const eventParticipants = event.eventParticipants || [];
        const participants = eventParticipants.map((p) => ({
          userId: p.staff.userId || '',
          username: p.staff.email.split('@')[0],
        }));
        if (participants.length > 0) {
          totalParticipants += participants.length;
          payloads.push({
            eventId: event.id,
            eventDate: event.eventDate,
            participants,
            type: 'nextday',
            journeyId: journeyId,
          });
        }
      });

      if (payloads.length > 0) {
        this.appLogService.stepLog(
          3,
          `Emitting next day reminders for ${payloads.length} events`,
          'CleaningCronService',
          journeyId,
          {
            eventCount: payloads.length,
            totalParticipants,
          },
        );

        payloads.forEach((payload) => {
          this.eventEmitter.emit(
            NotificationEvent.CLEANING_NEXT_DAY_REMINDER,
            payload,
          );
        });
      }

      this.appLogService.journeyLog(
        journeyId,
        `✅ Successfully sent next day reminders for ${payloads.length} events`,
        'CleaningCronService',
        {
          tomorrow: {
            date: tomorrow,
            totalEvents: tomorrowEvents.length,
            eventsWithParticipants: payloads.length,
            totalParticipants: totalParticipants,
          },
        },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Error sending next day reminders',
        error.stack,
        'CleaningCronService',
        { error: error.message, tomorrow },
      );
    }
  }

  async handleAutomaticCycleCreation(journeyId: string): Promise<void> {
    this.appLogService.journeyLog(
      journeyId,
      'Checking if new cleaning cycle needs to be created',
      'CleaningCronService',
    );

    try {
      const todayString = formatVn(nowVn(), 'yyyy-MM-dd');

      const activeCycle = await this.cleaningService.getActiveCycle();
      if (!activeCycle) {
        this.appLogService.journeyLog(
          journeyId,
          'No active cleaning cycle found for today. Checking if we need to start from absolute last event.',
          'CleaningCronService',
        );
      }

      if (!activeCycle) return;

      const eventDates = activeCycle.events.map((e) => e.eventDate).sort();
      const lastEventDateStr = eventDates[eventDates.length - 1];

      const { shouldTrigger, daysUntilEnd } = getCycleTriggerStatus(
        lastEventDateStr,
        todayString,
      );

      if (!shouldTrigger) {
        this.appLogService.journeyLog(
          journeyId,
          `Cleaning schedule is not near completion (${daysUntilEnd} days left). Skipping.`,
          'CleaningCronService',
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
        'Triggering new cleaning cycle creation!',
        'CleaningCronService',
      );
      await this.createNextCycle(activeCycle, journeyId);
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Error in automatic cycle creation check',
        error.stack,
        'CleaningCronService',
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
        'CleaningCronService',
      );
      return;
    }

    const algorithmStaff: Staff[] = staff.map((s) => ({
      id: s.id,
      username: s.email || s.user?.email || `staff_${s.id}`,
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
      ScheduleType.CLEANING,
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

    const nextValidStartDate = getNextCleaningDate(lastEventDate, holidaysStr);

    const config: SchedulerConfig = {
      type: ScheduleType.CLEANING,
      startDate: toDateString(nextValidStartDate),
      slotSize: 2,
      holidays: holidaysStr,
    };

    this.appLogService.stepLog(
      1,
      `Generating cleaning schedule for ${toDateString(startDate)}`,
      'CleaningCronService',
      journeyId,
      { config },
    );

    const schedule = SchedulingAlgorithm.generateNewCycle(
      algorithmStaff,
      previousCycleData,
      config,
    );

    await this.entityManager.transaction(async (manager) => {
      const newCycle = manager.create(ScheduleCycleEntity, {
        name: cycleName,
        type: ScheduleType.CLEANING,
        description,
        status: CycleStatus.DRAFT,
      });

      const savedCycle = await manager.save(ScheduleCycleEntity, newCycle);

      const events = schedule.map((scheduleEvent) => {
        const staffUsernames = scheduleEvent.staffIds.map((id) => {
          const staffMember = staff.find((s) => s.id === id);
          return staffMember?.email || staffMember?.user?.email || 'Không rõ';
        });

        const eventDate = fromDateString(scheduleEvent.date);
        const isSpecial = eventDate.getDay() === 5; // Friday

        const title = isSpecial
          ? `Dọn dẹp + Thứ Sáu (${staffUsernames.join(' & ')})`
          : `Dọn dẹp văn phòng (${staffUsernames.join(' & ')})`;

        const notes = isSpecial
          ? 'Dọn dẹp văn phòng + vệ sinh lò vi sóng và tủ lạnh (Thứ Sáu)'
          : 'Dọn dẹp văn phòng hàng ngày';

        return manager.create(ScheduleEventEntity, {
          title,
          type: ScheduleType.CLEANING,
          notes,
          eventDate: scheduleEvent.date,
          status: EventStatus.PENDING,
          cycle: savedCycle,
          eventParticipants: scheduleEvent.staffIds.map((staffId) =>
            manager.create(ScheduleEventParticipantEntity, { staffId }),
          ),
        });
      });

      await manager.save(ScheduleEventEntity, events);

      this.appLogService.journeyLog(
        journeyId,
        `✅ Created new cleaning cycle ${savedCycle.name} with ${events.length} events`,
        'CleaningCronService',
        { cycleId: savedCycle.id },
      );
    });
  }
}
