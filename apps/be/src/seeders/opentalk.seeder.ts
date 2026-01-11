import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CycleStatus, EventStatus, ScheduleType } from '@qnoffice/shared';
import { toDateString } from '@src/common/utils/date.utils';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import ScheduleCycleEntity from '@src/modules/schedule/enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '@src/modules/schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';
import {
  CycleData,
  SchedulerConfig,
  SchedulingAlgorithm,
  Staff,
} from '@src/modules/schedule/schedule.algorith';
import StaffEntity from '@src/modules/staff/staff.entity';
import console from 'console';
import { Repository } from 'typeorm';
interface EventData {
  title: string;
  type: string;
  notes: string;
  eventDate: string;
  status: EventStatus;
  cycleId: number;
  assignedStaff: StaffEntity | null | undefined;
}

const cycles = [
  {
    name: 'OpenTalk tháng 1/2026',
    type: ScheduleType.OPENTALK,
    description: 'Chuỗi OpenTalk hàng tuần tháng 1/2026',
    status: CycleStatus.ACTIVE,
  },
  // {
  //   name: 'OpenTalk tháng 2/2026',
  //   type: ScheduleType.OPENTALK,
  //   description: 'Chuỗi OpenTalk hàng tuần tháng 2/2026',
  //   status: CycleStatus.DRAFT,
  // },
];
@Injectable()
export class OpentalkSeeder {
  constructor(
    @InjectRepository(ScheduleCycleEntity)
    private readonly cycleRepository: Repository<ScheduleCycleEntity>,
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(ScheduleEventParticipantEntity)
    private readonly participantRepository: Repository<ScheduleEventParticipantEntity>,
    @InjectRepository(StaffEntity)
    private readonly staffRepository: Repository<StaffEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
  ) {}

  async seed() {
    console.log('Starting OpenTalk seeding...');

    const staff = await this.staffRepository.find({
      where: { status: 0 },
      relations: ['user'],
    });

    if (staff.length === 0) {
      console.log('No active staff found. Skipping OpenTalk seeding.');
      return;
    }
    const isHaveCycle = await this.cycleRepository.count({
      where: { type: ScheduleType.OPENTALK },
    });
    if (isHaveCycle) {
      console.log('OpenTalk cycles already exist. Skipping seeding.');
      return;
    }
    const createdCycles: ScheduleCycleEntity[] = [];
    for (const cycleData of cycles) {
      const cycle = this.cycleRepository.create(cycleData);
      const savedCycle = await this.cycleRepository.save(cycle);
      createdCycles.push(savedCycle);
      console.log(`Created cycle: ${cycleData.name}`);
    }

    await this.syncCurrentCycle({
      currentCycle: createdCycles[0],
      staff,
    });
    // await this.createNextCycle({
    //   staff,
    // });
  }

  private async syncCurrentCycle({ currentCycle, staff }) {
    const tienNguyen = staff.find(
      (s) =>
        s.user?.email?.includes('tien.nguyenvan') ||
        s.email?.includes('tien.nguyenvan'),
    );
    const hoNguyen = staff.find(
      (s) =>
        s.user?.email?.includes('ho.nguyenphi') ||
        s.email?.includes('ho.nguyenphi'),
    );
    const thangThieu = staff.find(
      (s) =>
        s.user?.email?.includes('thang.thieuquang') ||
        s.email?.includes('thang.thieuquang'),
    );
    const lichDuongthanh = staff.find(
      (s) =>
        s.user?.email?.includes('lich.duongthanh') ||
        s.email?.includes('lich.duongthanh'),
    );
    console.log('Found staff members:', {
      tien: tienNguyen
        ? `${tienNguyen.email} (ID: ${tienNguyen.id})`
        : 'Not found',
      ho: hoNguyen ? `${hoNguyen.email} (ID: ${hoNguyen.id})` : 'Not found',
      thang: thangThieu
        ? `${thangThieu.email} (ID: ${thangThieu.id})`
        : 'Not found',
      lich: lichDuongthanh
        ? `${lichDuongthanh.email} (ID: ${lichDuongthanh.id})`
        : 'Not found',
    });
    const januaryEvents: EventData[] = [
      {
        title: 'Multiplayer web game dưới góc nhìn của dev',
        type: 'OPENTALK',
        notes: 'Weekly Opentalk - Diễn giả: tien.nguyenvan',
        eventDate: '2026-01-10',
        status: EventStatus.ACTIVE,
        cycleId: currentCycle.id,
        assignedStaff: tienNguyen,
      },
      {
        title: 'OpenTalk hàng tuần #2',
        type: 'OPENTALK',
        notes: 'Weekly Opentalk - Diễn giả: ho.nguyenphi',
        eventDate: '2026-01-17',
        status: EventStatus.PENDING,
        cycleId: currentCycle.id,
        assignedStaff: hoNguyen,
      },
      {
        title: 'OpenTalk hàng tuần #3',
        type: 'OPENTALK',
        notes: 'Weekly Opentalk - Diễn giả: thang.thieuquang',
        eventDate: '2026-01-24',
        status: EventStatus.PENDING,
        cycleId: currentCycle.id,
        assignedStaff: thangThieu,
      },
      {
        title: 'OpenTalk hàng tuần #4',
        type: 'OPENTALK',
        notes: 'Weekly Opentalk - Chưa có diễn giả',
        eventDate: '2026-02-07',
        status: EventStatus.PENDING,
        cycleId: currentCycle.id,
        assignedStaff: lichDuongthanh,
      },
    ];

    for (const eventData of januaryEvents) {
      // Check if event already exists
      const existingEvent = await this.eventRepository.findOne({
        where: {
          title: eventData.title,
          cycleId: currentCycle.id,
        },
      });

      if (!existingEvent) {
        const event = this.eventRepository.create({
          title: eventData.title,
          type: eventData.type as any,
          notes: eventData.notes,
          eventDate: eventData.eventDate,
          status: eventData.status,
          cycleId: eventData.cycleId,
        });
        const savedEvent = await this.eventRepository.save(event);

        // Create participant relationship if staff is assigned
        if (eventData.assignedStaff) {
          const participant = this.participantRepository.create({
            eventId: savedEvent.id,
            staffId: eventData.assignedStaff!.id,
          });
          await this.participantRepository.save(participant);
        }

        console.log(
          `Created event: ${eventData.title} for ${eventData.eventDate}`,
        );
      }
    }
  }

  async createNextCycle({ staff }) {
    console.log('Generating next OpenTalk cycle...');
    const algorithmStaff: Staff[] = staff.map((s) => ({
      id: s.id,
      username: s.email || s.user?.email || `staff_${s.id}`,
    }));

    const previousCycle = await this.getPreviousCycleData();

    // Get holidays for the next 6 months
    const holidays = await this.getUpcomingHolidays();

    // Configure for OpenTalk (Saturdays only, 1 person per slot)
    const config: SchedulerConfig = {
      type: ScheduleType.OPENTALK,
      startDate: '2026-02-01', // Start of February
      slotSize: 1,
      holidays: holidays.map((h) =>
        typeof h.date === 'string' ? h.date : toDateString(h.date),
      ),
    };

    // Generate schedule using algorithm
    const schedule = SchedulingAlgorithm.generateNewCycle(
      algorithmStaff,
      previousCycle,
      config,
    );
    console.log('Generated schedule:', schedule);

    console.log(`Generated schedule with ${schedule.length} events`);

    // Create cycle for February
    const februaryCycle = await this.cycleRepository.findOne({
      where: { name: 'OpenTalk tháng 2/2026' },
    });

    if (!februaryCycle) {
      console.log('February cycle not found');
      return;
    }

    // Create events based on generated schedule
    for (let i = 0; i < schedule.length; i++) {
      const scheduleEvent = schedule[i];
      const assignedStaffId = scheduleEvent.staffIds[0]; // Only 1 person for OpenTalk

      const assignedStaff = staff.find((s) => s.id === assignedStaffId);

      const eventTitle = `OpenTalk hàng tuần #${i + 1}`;
      const presenterInfo = assignedStaff
        ? assignedStaff.email || assignedStaff.user?.email || 'Không rõ'
        : 'Chưa có diễn giả';

      const event = this.eventRepository.create({
        title: eventTitle,
        type: 'OPENTALK' as any,
        notes: `Weekly Opentalk - Diễn giả: ${presenterInfo}`,
        eventDate: scheduleEvent.date,
        status: EventStatus.PENDING,
        cycleId: februaryCycle.id,
      });

      const savedEvent = await this.eventRepository.save(event);

      if (assignedStaffId) {
        const participant = this.participantRepository.create({
          eventId: savedEvent.id,
          staffId: assignedStaffId,
        });
        await this.participantRepository.save(participant);
      }

      console.log(
        `Created event: ${eventTitle} on ${scheduleEvent.date} for ${presenterInfo}`,
      );
    }

    console.log('Next cycle generation completed!');
  }

  private async getPreviousCycleData(): Promise<CycleData | null> {
    const januaryCycle = await this.cycleRepository.findOne({
      where: { name: 'OpenTalk January 2026' },
    });
    if (!januaryCycle) {
      console.log('No January cycle found, returning null');
      return null;
    }
    const events = await this.eventRepository.find({
      where: { cycleId: januaryCycle.id },
      relations: ['eventParticipants'],
      order: { eventDate: 'ASC' },
    });
    const algorithmEvents = events.map((event) => ({
      date: event.eventDate,
      staffIds: event.eventParticipants.map((p) => p.staffId),
    }));

    return {
      id: januaryCycle.id,
      events: algorithmEvents,
    };
  }

  private async getUpcomingHolidays(): Promise<HolidayEntity[]> {
    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-12-31');

    return this.holidayRepository
      .createQueryBuilder('holiday')
      .where('holiday.date >= :startDate', {
        startDate: startDate.toISOString().split('T')[0],
      })
      .andWhere('holiday.date <= :endDate', {
        endDate: endDate.toISOString().split('T')[0],
      })
      .getMany();
  }
}
