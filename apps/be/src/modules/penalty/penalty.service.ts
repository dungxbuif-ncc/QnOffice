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
import { PenaltyProofEntity } from './entities/penalty-proof.entity';
import { Penalty } from './penalty.entity';

@Injectable()
export class PenaltyService {
  constructor(
    @InjectRepository(Penalty)
    private readonly penaltyRepository: Repository<Penalty>,
    private readonly penaltyTypeService: PenaltyTypeService,
    @InjectRepository(PenaltyProofEntity)
    private readonly penaltyProofRepository: Repository<PenaltyProofEntity>,
  ) {}

  async create(createPenaltyDto: CreatePenaltyDto): Promise<Penalty> {
    const penaltyType = await this.penaltyTypeService.findOne(
      createPenaltyDto.penaltyTypeId,
    );

    const penalty = this.penaltyRepository.create({
      staffId: createPenaltyDto.staffId,
      penaltyTypeId: createPenaltyDto.penaltyTypeId,
      date: new Date(createPenaltyDto.date),
      reason: createPenaltyDto.reason,
      amount: createPenaltyDto.amount ?? penaltyType.amount,

      proofs: createPenaltyDto.proofs?.map((p) => ({
        imageKey: p.imageKey,
        mimeType: p.mimeType,
      })),
    });

    return this.penaltyRepository.save(penalty);
  }

  async findAll(
    queries: AppPaginateOptionsDto,
  ): Promise<AppPaginationDto<Penalty>> {
    const [data, total] = await this.penaltyRepository.findAndCount({
      skip: queries.skip,
      take: queries.take,
      relations: ['penaltyType', 'staff', 'staff.user', 'proofs'],
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
      relations: ['penaltyType', 'staff', 'staff.user', 'proofs'],
    });

    if (!penalty) {
      throw new NotFoundException(`Penalty with ID ${id} not found`);
    }

    return penalty;
  }

  async findByUser(staffId: number): Promise<Penalty[]> {
    return this.penaltyRepository.find({
      where: { staffId },
      relations: ['penaltyType'],
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
    const penalty = await this.penaltyRepository.findOne({
      where: { id },
      relations: ['proofs'],
    });

    if (!penalty) {
      throw new NotFoundException('Penalty not found');
    }

    if (updateEvidenceDto.reason !== undefined) {
      penalty.reason = updateEvidenceDto.reason;
    }

    if (updateEvidenceDto.proofs) {
      penalty.proofs = updateEvidenceDto.proofs.map((p) =>
        this.penaltyProofRepository.create({
          imageKey: p.imageKey,
          mimeType: p.mimeType,
        }),
      );
    }

    return this.penaltyRepository.save(penalty);
  }

  async remove(id: number): Promise<void> {
    const penalty = await this.findOne(id);
    await this.penaltyRepository.remove(penalty);
  }

  async getTotalByUser(
    staffId: number,
  ): Promise<{ total: number; unpaid: number }> {
    const penalties = await this.penaltyRepository.find({
      where: { staffId },
    });

    const total = penalties.reduce((sum, p) => sum + Number(p.amount), 0);
    const unpaid = penalties
      .filter((p) => p.status === PenaltyStatus.UNPAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return { total, unpaid };
  }

  async findAllGroupedByUser(
    queries: AppPaginateOptionsDto,
  ): Promise<AppPaginationDto<any>> {
    const { skip, take } = queries;
    const [allPenalties] = await this.penaltyRepository.findAndCount({
      relations: ['penaltyType', 'staff', 'staff.user', 'proofs'],
      order: { createdAt: SearchOrder.DESC },
    });

    // Group by staffId
    const groupedMap = new Map<number, any>();

    for (const penalty of allPenalties) {
      const staffId = penalty.staffId;
      if (!groupedMap.has(staffId)) {
        groupedMap.set(staffId, {
          staff: penalty.staff,
          totalAmount: 0,
          penaltyCount: 0,
          penalties: [],
        });
      }

      const group = groupedMap.get(staffId);
      group.totalAmount += Number(penalty.amount);
      group.penaltyCount += 1;
      group.penalties.push(penalty);
    }

    const groupedResult = Array.from(groupedMap.values());

    // Manual application of pagination to the grouped result
    // Note: 'total' from findAndCount is total penalties, not total groups. 
    // We should probably return total groups for pagination context if needed, 
    // but preserving the interface signature for now.
    
    // Slicing the grouped result for pagination
    const paginatedResult = groupedResult.slice(skip, skip + take);

    return {
      page: queries.page,
      pageSize: queries.take,
      total: groupedResult.length,
      result: paginatedResult,
    };
  }
}
