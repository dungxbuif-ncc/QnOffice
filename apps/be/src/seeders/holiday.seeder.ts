import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import { Repository } from 'typeorm';

const holidays2026 = [
  // Tet Holiday (Vietnamese New Year) - Feb 16-21, 2026
  {
    name: 'Tet Holiday - Day 1',
    date: '2026-02-16',
    description: 'Vietnamese New Year - First Day',
  },
  {
    name: 'Tet Holiday - Day 2',
    date: '2026-02-17',
    description: 'Vietnamese New Year - Second Day',
  },
  {
    name: 'Tet Holiday - Day 3',
    date: '2026-02-18',
    description: 'Vietnamese New Year - Third Day',
  },
  {
    name: 'Tet Holiday - Day 4',
    date: '2026-02-19',
    description: 'Vietnamese New Year - Fourth Day',
  },
  {
    name: 'Tet Holiday - Day 5',
    date: '2026-02-20',
    description: 'Vietnamese New Year - Fifth Day',
  },
  {
    name: 'Tet Holiday - Day 6',
    date: '2026-02-21',
    description: 'Vietnamese New Year - Sixth Day',
  },
  // Hung Kings' Temple Festival
  {
    name: 'Hung Kings Temple Festival',
    date: '2026-04-27',
    description: 'Gio To Hung Vuong - Commemoration Day for Hung Kings',
  },
  // Liberation Day and Labor Day
  {
    name: 'Liberation Day',
    date: '2026-04-30',
    description: 'Southern Liberation Day - Victory Day',
  },
  {
    name: 'International Labor Day',
    date: '2026-05-01',
    description: 'International Workers Day',
  },
  // National Day
  {
    name: 'National Day',
    date: '2026-09-02',
    description: 'Vietnam Independence Day - Quoc Khanh',
  },
];

@Injectable()
export class HolidaySeeder {
  constructor(
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
  ) {}

  async seed(): Promise<void> {
    console.log('Starting Holiday seeding...');

    for (const holidayData of holidays2026) {
      // Check if holiday already exists
      const existingHoliday = await this.holidayRepository.findOne({
        where: {
          date: holidayData.date,
        },
      });

      if (!existingHoliday) {
        const holiday = this.holidayRepository.create({
          name: holidayData.name,
          date: holidayData.date,
        });

        await this.holidayRepository.save(holiday);
        console.log(
          `Created holiday: ${holidayData.name} on ${holidayData.date}`,
        );
      } else {
        console.log(
          `Holiday already exists: ${holidayData.name} on ${holidayData.date}`,
        );
      }
    }

    console.log('Holiday seeding completed!');
  }
}
