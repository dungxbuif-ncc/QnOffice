import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PenaltyStatus, SearchOrder } from '@qnoffice/shared';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import { Repository } from 'typeorm';
import { PenaltyTypeService } from '../penalty-type/penalty-type.service';
import { CreatePenaltyDto } from './dto/create-penalty.dto';
import { UpdatePenaltyEvidenceDto } from './dto/update-penalty-evidence.dto';
import { UpdatePenaltyDto } from './dto/update-penalty.dto';
import { Penalty } from './penalty.entity';

@Injectable()
export class PenaltyService {
  constructor(
    @InjectRepository(Penalty)
    private readonly penaltyRepository: Repository<Penalty>,
    private readonly penaltyTypeService: PenaltyTypeService,
  ) {}

  async create(createPenaltyDto: CreatePenaltyDto): Promise<Penalty> {
    const penaltyType = await this.penaltyTypeService.findOne(
      createPenaltyDto.penalty_type_id,
    );

    const penalty = this.penaltyRepository.create({
      ...createPenaltyDto,
      amount: createPenaltyDto.amount ?? penaltyType.amount,
    });

    return this.penaltyRepository.save(penalty);
  }

  async findAll(
    queries: AppPaginateOptionsDto,
  ): Promise<AppPaginationDto<Penalty>> {
    const [data, total] = await this.penaltyRepository.findAndCount({
      skip: queries.skip,
      take: queries.take,
      relations: ['penaltyType', 'campaign'],
      order: { createdAt: SearchOrder.DESC },
    });
    return {
      page: queries.page,
      pageSize: queries.take,
      total,
      result: data,
    };
  }

  async findOne(id: number): Promise<Penalty> {
    const penalty = await this.penaltyRepository.findOne({
      where: { id },
      relations: ['penaltyType', 'campaign'],
    });

    if (!penalty) {
      throw new NotFoundException(`Penalty with ID ${id} not found`);
    }

    return penalty;
  }

  async findByUser(userId: number): Promise<Penalty[]> {
    return this.penaltyRepository.find({
      where: { user_id: userId },
      relations: ['penaltyType', 'campaign'],
      order: { createdAt: SearchOrder.DESC },
    });
  }

  async update(
    id: number,
    updatePenaltyDto: UpdatePenaltyDto,
  ): Promise<Penalty> {
    const penalty = await this.findOne(id);
    Object.assign(penalty, updatePenaltyDto);
    return this.penaltyRepository.save(penalty);
  }

  async updateEvidence(
    id: number,
    updateEvidenceDto: UpdatePenaltyEvidenceDto,
  ): Promise<Penalty> {
    const penalty = await this.findOne(id);

    penalty.evidence_urls = updateEvidenceDto.evidence_urls;

    if (updateEvidenceDto.reason) {
      penalty.reason = updateEvidenceDto.reason;
    }

    return this.penaltyRepository.save(penalty);
  }

  async remove(id: number): Promise<void> {
    const penalty = await this.findOne(id);
    await this.penaltyRepository.remove(penalty);
  }

  async getTotalByUser(
    userId: number,
  ): Promise<{ total: number; unpaid: number }> {
    const penalties = await this.penaltyRepository.find({
      where: { user_id: userId },
    });

    const total = penalties.reduce((sum, p) => sum + Number(p.amount), 0);
    const unpaid = penalties
      .filter((p) => p.status === PenaltyStatus.UNPAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return { total, unpaid };
  }
}
