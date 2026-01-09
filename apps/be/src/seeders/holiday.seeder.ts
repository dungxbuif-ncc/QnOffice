import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import { Repository } from 'typeorm';

const holidays2026 = [
  {
    name: 'Tết Nguyên Đán - Ngày 1',
    date: '2026-02-16',
    description: 'Tết Nguyên Đán - Mùng 1',
  },
  {
    name: 'Tết Nguyên Đán - Ngày 2',
    date: '2026-02-17',
    description: 'Tết Nguyên Đán - Mùng 2',
  },
  {
    name: 'Tết Nguyên Đán - Ngày 3',
    date: '2026-02-18',
    description: 'Tết Nguyên Đán - Mùng 3',
  },
  {
    name: 'Tết Nguyên Đán - Ngày 4',
    date: '2026-02-19',
    description: 'Tết Nguyên Đán - Mùng 4',
  },
  {
    name: 'Tết Nguyên Đán - Ngày 5',
    date: '2026-02-20',
    description: 'Tết Nguyên Đán - Mùng 5',
  },
  {
    name: 'Tết Nguyên Đán - Ngày 6',
    date: '2026-02-21',
    description: 'Tết Nguyên Đán - Mùng 6',
  },
  // Giỗ Tổ Hùng Vương
  {
    name: 'Giỗ Tổ Hùng Vương',
    date: '2026-04-27',
    description: 'Ngày Giỗ Tổ Hùng Vương',
  },
  // Ngày Giải phóng và Quốc tế Lao động
  {
    name: 'Ngày Giải phóng miền Nam',
    date: '2026-04-30',
    description: 'Ngày Giải phóng miền Nam',
  },
  {
    name: 'Quốc tế Lao động',
    date: '2026-05-01',
    description: 'Ngày Quốc tế Lao động',
  },
  // Quốc khánh
  {
    name: 'Quốc khánh',
    date: '2026-09-02',
    description: 'Ngày Quốc khánh Việt Nam',
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
