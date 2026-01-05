import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import StaffEntity from '@src/modules/staff/staff.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffEntity)
    private readonly staffRepository: Repository<StaffEntity>,
  ) {}

  async getStaffs(
    queries: AppPaginateOptionsDto,
  ): Promise<AppPaginationDto<StaffEntity>> {
    const [data, total] = await this.staffRepository.findAndCount({
      skip: queries.skip,
      take: queries.take,
    });
    return {
      page: queries.page,
      pageSize: queries.take,
      total,
      result: data,
    };
  }
}
