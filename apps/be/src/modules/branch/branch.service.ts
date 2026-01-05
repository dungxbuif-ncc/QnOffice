import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import { BranchEntity } from '@src/modules/branch/branch.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
  ) {}

  async findAll(
    queries: AppPaginateOptionsDto,
  ): Promise<AppPaginationDto<BranchEntity>> {
    const [result, total] = await this.branchRepository.findAndCount({
      order: { createdAt: queries.order },
      skip: queries.skip,
      take: queries.take,
    });

    return {
      page: queries.page,
      pageSize: queries.take,
      total,
      result,
    };
  }

  async findOne(id: number): Promise<BranchEntity | null> {
    return this.branchRepository.findOne({
      where: { id },
      relations: ['users'],
    });
  }

  async create(branchData: Partial<BranchEntity>): Promise<BranchEntity> {
    const branch = this.branchRepository.create(branchData);
    return this.branchRepository.save(branch);
  }

  async update(
    id: number,
    branchData: Partial<BranchEntity>,
  ): Promise<BranchEntity | null> {
    await this.branchRepository.update(id, branchData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.branchRepository.delete(id);
  }
}
