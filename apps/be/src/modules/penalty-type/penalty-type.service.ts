import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import { Repository } from 'typeorm';
import { CreatePenaltyTypeDto } from './dto/create-penalty-type.dto';
import { UpdatePenaltyTypeDto } from './dto/update-penalty-type.dto';
import { PenaltyType } from './penalty-type.entity';

@Injectable()
export class PenaltyTypeService {
  constructor(
    @InjectRepository(PenaltyType)
    private readonly penaltyTypeRepository: Repository<PenaltyType>,
  ) {}

  async create(
    createPenaltyTypeDto: CreatePenaltyTypeDto,
  ): Promise<PenaltyType> {
    const penaltyType = this.penaltyTypeRepository.create(createPenaltyTypeDto);
    return this.penaltyTypeRepository.save(penaltyType);
  }

  async findAll(
    queries: AppPaginateOptionsDto,
  ): Promise<AppPaginationDto<PenaltyType>> {
    const [data, total] = await this.penaltyTypeRepository.findAndCount({
      skip: queries.skip,
      take: queries.take,
      order: { name: 'ASC' },
    });
    return {
      page: queries.page,
      pageSize: queries.take,
      total,
      result: data,
    };
  }

  async findOne(id: number): Promise<PenaltyType> {
    const penaltyType = await this.penaltyTypeRepository.findOne({
      where: { id },
    });

    if (!penaltyType) {
      throw new NotFoundException(`Penalty type with ID ${id} not found`);
    }

    return penaltyType;
  }

  async update(
    id: number,
    updatePenaltyTypeDto: UpdatePenaltyTypeDto,
  ): Promise<PenaltyType> {
    const penaltyType = await this.findOne(id);
    Object.assign(penaltyType, updatePenaltyTypeDto);
    return this.penaltyTypeRepository.save(penaltyType);
  }

  async remove(id: number): Promise<void> {
    const penaltyType = await this.findOne(id);
    await this.penaltyTypeRepository.remove(penaltyType);
  }
}
