import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import CreateHolidayDto from '@src/modules/holiday/dtos/create-holiday.dto';
import CreateHolidaysRangeDto from '@src/modules/holiday/dtos/create-holidays-range.dto';
import { HolidayQuery } from '@src/modules/holiday/dtos/holiday.query';
import UpdateHolidayDto from '@src/modules/holiday/dtos/update-holiday.dto';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HolidayService {
  constructor(
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
  ) {}

  async getAllHolidays(
    query: HolidayQuery,
  ): Promise<AppPaginationDto<HolidayEntity>> {
    const qb = this.holidayRepository.createQueryBuilder('holiday');

    if (query.startDate) {
      qb.andWhere('holiday.date >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('holiday.date <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('holiday.date', query.order || 'DESC')
      .skip((query.page - 1) * query.take)
      .take(query.take);

    const [result, total] = await qb.getManyAndCount();

    return {
      result,
      total,
      page: query.page,
      pageSize: query.take,
    };
  }

  async getHolidayById(id: number): Promise<HolidayEntity> {
    const holiday = await this.holidayRepository.findOneBy({ id });
    if (!holiday) {
      throw new NotFoundException(`Holiday with ID ${id} not found`);
    }
    return holiday;
  }

  async createHoliday(dto: CreateHolidayDto): Promise<HolidayEntity> {
    const holidayDate = new Date(dto.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (holidayDate < today) {
      throw new BadRequestException('Cannot create a holiday in the past');
    }

    const existingHoliday = await this.holidayRepository.findOne({
      where: { date: holidayDate },
    });

    if (existingHoliday) {
      throw new BadRequestException('A holiday already exists on this date');
    }

    const holiday = this.holidayRepository.create({
      date: holidayDate,
      name: dto.name,
    });

    return this.holidayRepository.save(holiday);
  }
  async createHolidaysByRange(
    dto: CreateHolidaysRangeDto,
  ): Promise<HolidayEntity[]> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validation
    if (startDate < today) {
      throw new BadRequestException('Cannot create holidays in the past');
    }

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Calculate date range (limit to prevent abuse)
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff > 365) {
      throw new BadRequestException('Date range cannot exceed 365 days');
    }

    // Check for existing holidays in the range
    const existingHolidays = await this.holidayRepository
      .createQueryBuilder('holiday')
      .where('holiday.date >= :startDate', { startDate: dto.startDate })
      .andWhere('holiday.date <= :endDate', { endDate: dto.endDate })
      .getMany();

    if (existingHolidays.length > 0) {
      const existingDates = existingHolidays
        .map((h) =>
          typeof h.date === 'string'
            ? h.date
            : h.date?.toISOString().split('T')[0],
        )
        .join(', ');
      throw new BadRequestException(
        `Holidays already exist on the following dates: ${existingDates}`,
      );
    }

    // Generate holidays for each day in the range
    const holidays: HolidayEntity[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const holiday = this.holidayRepository.create({
        date: new Date(currentDate),
        name: dto.name,
      });
      holidays.push(holiday);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return this.holidayRepository.save(holidays);
  }

  async;
  async updateHoliday(
    id: number,
    dto: UpdateHolidayDto,
  ): Promise<HolidayEntity> {
    const holiday = await this.getHolidayById(id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDate = new Date(holiday.date);
    if (currentDate < today) {
      throw new BadRequestException('Cannot edit a holiday in the past');
    }

    if (dto.date) {
      const newDate = new Date(dto.date);
      if (newDate < today) {
        throw new BadRequestException('Cannot set holiday date to the past');
      }

      const existingHoliday = await this.holidayRepository.findOne({
        where: { date: newDate },
      });

      if (existingHoliday && existingHoliday.id !== id) {
        throw new BadRequestException('A holiday already exists on this date');
      }

      holiday.date = newDate;
    }

    if (dto.name) {
      holiday.name = dto.name;
    }

    return this.holidayRepository.save(holiday);
  }
}
