import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CycleStatus, EventStatus, ScheduleType } from '@qnoffice/shared';
import { fromDateString, toDateString } from '@src/common/utils/date.utils';
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
import { Between, Repository } from 'typeorm';
const cycles = [
  {
    name: 'Dọn dẹp văn phòng tháng 12/2025 - 1/2026',
    type: ScheduleType.CLEANING,
    description:
      'Lịch dọn dẹp văn phòng hàng ngày từ tháng 12/2025 đến tháng 1/2026',
    status: 'ACTIVE' as any,
  },
];
const cleaningEvents: Array<{
  date: string;
  participants: string[];
}> = [
  // December 2025
  {
    date: '2025-12-01',
    participants: ['cong.letrong', 'dat.haquoc'],
  },
  {
    date: '2025-12-02',
    participants: ['du.levanky', 'dung.buihuu'],
  },
  {
    date: '2025-12-03',
    participants: ['dung.phammanh', 'duy.huynhle'],
  },
  {
    date: '2025-12-04',
    participants: ['huy.trannam', 'duy.nguyenxuan'],
  },
  {
    date: '2025-12-05',
    participants: ['hien.nguyenthanh', 'huong.nguyenthithanh'],
  },
  {
    date: '2025-12-08',
    participants: ['ho.nguyenphi', 'hoang.tranlehuy'],
  },
  {
    date: '2025-12-09',
    participants: ['tam.daonhon', 'thang.thieuquang'],
  },
  {
    date: '2025-12-10',
    participants: ['phuong.nguyenhonghang', 'son.cuhoangnguyen'],
  },
  {
    date: '2025-12-11',
    participants: ['kien.trinhduy', 'lich.duongthanh'],
  },
  {
    date: '2025-12-12',
    participants: ['ngan.tonthuy', 'tien.nguyenvan'],
  },
  {
    date: '2025-12-15',
    participants: ['loi.huynhphuc', 'minh.dovan'],
  },
  {
    date: '2025-12-16',
    participants: ['nguyet.buianh', 'tuan.nguyentrong'],
  },
  {
    date: '2025-12-17',
    participants: ['nhan.nguyentrung', 'quang.tranduong'],
  },
  {
    date: '2025-12-18',
    participants: ['nguyen.nguyenphuoc', 'trinh.truongthiphuong'],
  },
  {
    date: '2025-12-19',
    participants: ['thuan.nguyenleanh', 'tien.caothicam'],
  },
  {
    date: '2025-12-22',
    participants: ['cong.letrong', 'dung.buihuu'],
  },
  {
    date: '2025-12-23',
    participants: ['dat.haquoc', 'dung.phammanh'],
  },
  {
    date: '2025-12-24',
    participants: ['du.levanky', 'hien.nguyenthanh'],
  },
  { date: '2025-12-25', participants: ['duy.huynhle', 'ho.nguyenphi'] },
  {
    date: '2025-12-26',
    participants: ['duy.nguyenxuan', 'hoang.tranlehuy'],
  },
  {
    date: '2025-12-29',
    participants: ['huy.trannam', 'thang.thieuquang'],
  },
  {
    date: '2025-12-30',
    participants: ['huong.nguyenthithanh', 'loi.huynhphuc'],
  },
  {
    date: '2025-12-31',
    participants: ['tam.daonhon', 'nguyen.nguyenphuoc'],
  },

  // January 2026
  {
    date: '2026-01-02',
    participants: ['kien.trinhduy', 'lich.duongthanh'],
  },
  {
    date: '2026-01-05',
    participants: ['minh.dovan', 'ngan.tonthuy'],
  },
  {
    date: '2026-01-06',
    participants: ['phu.nguyenthien', 'phuong.nguyenhonghang'],
  },
  {
    date: '2026-01-07',
    participants: ['quang.tranduong', 'son.cuhoangnguyen'],
  },
  {
    date: '2026-01-08',
    participants: ['tien.nguyenvan', 'trinh.truongthiphuong'],
  },
  {
    date: '2026-01-09',
    participants: ['dung.buihuu', 'dung.phammanh'],
  },
  {
    date: '2026-01-12',
    participants: ['duy.huynhle', 'duy.nguyenxuan'],
  },
  { date: '2026-01-13', participants: ['du.levanky', 'dat.haquoc'] },
  {
    date: '2026-01-14',
    participants: ['hien.nguyenthanh', 'hoang.tranlehuy'],
  },
  { date: '2026-01-15', participants: ['ho.nguyenphi', 'huy.trannam'] },
  {
    date: '2026-01-16',
    participants: ['huong.nguyenthithanh', 'loi.huynhphuc'],
  },
  {
    date: '2026-01-19',
    participants: ['nguyen.nguyenphuoc', 'tam.daonhon'],
  },
  {
    date: '2026-01-20',
    participants: ['thang.thieuquang', 'thuan.nguyenleanh'],
  },
  {
    date: '2026-01-21',
    participants: ['tien.caothicam', 'tuan.nguyentrong'],
  },
  {
    date: '2026-01-22',
    participants: ['kien.trinhduy', 'lich.duongthanh'],
  },
  {
    date: '2026-01-23',
    participants: ['minh.dovan', 'ngan.tonthuy'],
  },
  {
    date: '2026-01-26',
    participants: ['phu.nguyenthien', 'phuong.nguyenhonghang'],
  },
  {
    date: '2026-01-27',
    participants: ['quang.tranduong', 'son.cuhoangnguyen'],
  },
  {
    date: '2026-01-28',
    participants: ['tien.nguyenvan', 'trinh.truongthiphuong'],
  },
  {
    date: '2026-01-29',
    participants: ['dung.buihuu', 'dung.phammanh'],
  },
  {
    date: '2026-01-30',
    participants: ['duy.huynhle', 'duy.nguyenxuan'],
  },
];

@Injectable()
export class CleaningSeeder {
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
    console.log('Starting Cleaning seeding...');

    const staff = await this.staffRepository.find({
      where: { status: 0 },
      relations: ['user'],
    });

    if (staff.length === 0) {
      console.log('No active staff found, skipping cleaning seeder');
      return;
    }
    const isHaveCycle = await this.cycleRepository.count({
      where: { type: ScheduleType.CLEANING },
    });

    const isHaveEvents = await this.eventRepository.count({
      where: { type: ScheduleType.CLEANING },
    });

    if (isHaveCycle && isHaveEvents) {
      console.log(
        'Cleaning cycles and events already exist. Skipping seeding.',
      );
      return;
    }
    const createdCycles: ScheduleCycleEntity[] = [];

    // Create or find the single cycle
    const cycleData = cycles[0];
    let cycle = await this.cycleRepository.findOne({
      where: { name: cycleData.name },
    });

    if (!cycle) {
      cycle = this.cycleRepository.create(cycleData);
      const savedCycle = await this.cycleRepository.save(cycle);
      createdCycles.push(savedCycle);
      console.log(`Created cleaning cycle: ${savedCycle.name}`);
    } else {
      console.log(`Using existing cycle: ${cycle.name}`);
      createdCycles.push(cycle);
    }

    // Create all events for the single cycle
    await this.syncCurrentCycle({
      currentCycle: createdCycles[0],
      staff,
    });

    // Generate February events in a new cycle
    await this.createFebruaryEvents({
      staff,
    });
  }

  private findStaffByEmail(
    staff: StaffEntity[],
    email: string,
  ): StaffEntity | undefined {
    return staff.find(
      (s) => s.user?.email?.includes(email) || s.email?.includes(email),
    );
  }

  private async syncCurrentCycle({ currentCycle, staff }) {
    console.log('Creating cleaning events for current cycle...');

    for (const eventData of cleaningEvents) {
      // Find staff members
      const assignedStaff: StaffEntity[] = [];
      for (const participantEmail of eventData.participants) {
        const staffMember = this.findStaffByEmail(staff, participantEmail);
        if (staffMember) {
          assignedStaff.push(staffMember);
        } else {
          console.log(`Staff member not found: ${participantEmail}`);
        }
      }

      if (assignedStaff.length < 2) {
        console.log(
          `Skipping event ${eventData.date} - insufficient staff found`,
        );
        continue;
      }

      const eventDate = new Date(eventData.date);
      const isSpecial = eventDate.getDay() === 5;

      const notes = isSpecial
        ? 'Dọn dẹp văn phòng + vệ sinh lò vi sóng và tủ lạnh (đặc biệt Thứ Sáu)'
        : 'Dọn dẹp văn phòng hàng ngày';

      const title = isSpecial
        ? `Dọn dẹp + Đặc biệt (${assignedStaff.map((s) => s.email || s.user?.email || 'Không rõ').join(' & ')})`
        : `Dọn dẹp văn phòng (${assignedStaff.map((s) => s.email || s.user?.email || 'Không rõ').join(' & ')})`;

      const existingEvent = await this.eventRepository.findOne({
        where: {
          cycleId: currentCycle.id,
          eventDate: eventData.date,
          type: ScheduleType.CLEANING,
        },
      });

      if (existingEvent) {
        console.log(
          `[DEBUG] Event ${eventData.date} already exists - NO INSERT, NO EVENT FIRED`,
        );
        continue;
      }

      // Determine status based on current date
      const currentDate = new Date('2026-01-07'); // Current date from context
      const status =
        eventDate < currentDate ? EventStatus.COMPLETED : EventStatus.PENDING;

      const event = this.eventRepository.create({
        title,
        type: ScheduleType.CLEANING,
        notes,
        eventDate: eventData.date,
        status,
        cycleId: currentCycle.id,
      });

      const savedEvent = await this.eventRepository.save(event);

      // Create participants
      for (const staffMember of assignedStaff) {
        const participant = this.participantRepository.create({
          eventId: savedEvent.id,
          staffId: staffMember.id,
        });
        await this.participantRepository.save(participant);
      }

      console.log(
        `Created cleaning event: ${eventData.date} - ${assignedStaff.map((s) => s.email || s.user?.email).join(' & ')}`,
      );
    }
  }

  async createFebruaryEvents({ staff }) {
    console.log('Generating new February cleaning cycle...');
    const algorithmStaff: Staff[] = staff.map((s) => ({
      id: s.id,
      username: s.email || s.user?.email || `staff_${s.id}`,
    }));

    const previousCycle = await this.getPreviousCycleData();

    // Get holidays for the next 3 months
    const holidays = await this.getUpcomingHolidays();

    // Configure for Cleaning (Monday-Friday, 2 people per slot)
    const config: SchedulerConfig = {
      type: ScheduleType.CLEANING,
      startDate: '2026-02-01',
      slotSize: 2,
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

    // Create new February cycle
    const februaryCycle = this.cycleRepository.create({
      name: 'Cleaning February 2026',
      type: ScheduleType.CLEANING,
      description: 'Auto-generated daily cleaning schedule for February 2026',
      status: CycleStatus.DRAFT,
    });

    const savedCycle = await this.cycleRepository.save(februaryCycle);

    // Create events from generated schedule in the new cycle
    for (const event of schedule) {
      const eventDate = fromDateString(event.date);
      const notes =
        eventDate.getDay() === 5 // Friday
          ? 'Dọn dẹp văn phòng + vệ sinh lò vi sóng và tủ lạnh (đặc biệt Thứ Sáu)'
          : 'Dọn dẹp văn phòng hàng ngày';

      const isSpecial = eventDate.getDay() === 5;
      const staffUsernames = event.staffIds.map((id) => {
        const staffMember = staff.find((s) => s.id === id);
        return staffMember?.email || staffMember?.user?.email || 'Không rõ';
      });

      const title = isSpecial
        ? `Dọn dẹp + Đặc biệt (${staffUsernames.join(' & ')})`
        : `Dọn dẹp văn phòng (${staffUsernames.join(' & ')})`;

      const createdEvent = this.eventRepository.create({
        title,
        type: ScheduleType.CLEANING,
        notes,
        eventDate: event.date,
        status: EventStatus.PENDING,
        cycleId: savedCycle.id,
      });

      const savedEvent = await this.eventRepository.save(createdEvent);

      // Create participants
      for (const staffId of event.staffIds) {
        const participant = this.participantRepository.create({
          eventId: savedEvent.id,
          staffId: staffId,
        });
        await this.participantRepository.save(participant);
      }
    }

    console.log(
      `Generated ${schedule.length} cleaning events for February 2026 in new cycle`,
    );
  }

  private async getPreviousCycleData(): Promise<CycleData | null> {
    const previousCycle = await this.cycleRepository.findOne({
      where: { type: ScheduleType.CLEANING, status: CycleStatus.ACTIVE },
      relations: [
        'events',
        'events.eventParticipants',
        'events.eventParticipants.staff',
      ],
    });

    if (!previousCycle) {
      return null;
    }

    return {
      id: previousCycle.id,
      events: previousCycle.events.map((event) => ({
        date: event.eventDate, // Already a string
        staffIds: event.eventParticipants.map(
          (participant) => participant.staffId,
        ),
      })),
    };
  }

  private async getUpcomingHolidays(): Promise<HolidayEntity[]> {
    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-05-31');

    return this.holidayRepository.find({
      where: {
        date: Between(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
        ),
      },
    });
  }
}
