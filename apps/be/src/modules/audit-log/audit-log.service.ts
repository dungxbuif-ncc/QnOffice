import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import { Between, FindOptionsWhere, LessThan, Repository } from 'typeorm';
import AuditLogEntity from './audit-log.entity';
import { AuditLogSearchParamsDto, CreateAuditLogDto } from './dtos';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async createLog(
    createDto: CreateAuditLogDto,
    createdBy?: number,
  ): Promise<void> {
    setImmediate(async () => {
      try {
        const log = this.auditLogRepository.create({
          ...createDto,
          createdBy: createdBy || null,
          updatedBy: createdBy || null,
        });
        await this.auditLogRepository.save(log);
      } catch (error) {
        console.error('Failed to save audit log:', error);
      }
    });
  }

  async findAll(
    searchParams: AuditLogSearchParamsDto,
  ): Promise<AppPaginationDto<AuditLogEntity>> {
    const { level, context, journeyId, startDate, endDate } = searchParams;

    const where: FindOptionsWhere<AuditLogEntity> = {};

    if (level) {
      where.level = level;
    }
    if (context) {
      where.context = context;
    }
    if (journeyId) {
      where.journeyId = journeyId;
    }
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = Between(new Date(startDate), new Date());
    }

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
    });

    return {
      result: logs,
      total,
      page: 1,
      pageSize: total,
    };
  }

  async findByJourneyId(journeyId: string): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.find({
      where: { journeyId },
      order: { createdAt: 'ASC' },
    });
  }

  async getContexts(): Promise<string[]> {
    const result = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.context', 'context')
      .where('log.context IS NOT NULL')
      .getRawMany();

    return result.map((row) => row.context).filter(Boolean);
  }

  async deleteOldLogs(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.auditLogRepository.delete({
      createdAt: LessThan(cutoffDate),
    });
    return result.affected || 0;
  }

  async getLogStats() {
    const totalLogs = await this.auditLogRepository.count();
    const last24Hours = await this.auditLogRepository.count({
      where: {
        createdAt: Between(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
        ),
      },
    });

    const levelStats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.level')
      .getRawMany();

    return {
      totalLogs,
      last24Hours,
      levelStats: levelStats.map((stat) => ({
        level: stat.level,
        count: parseInt(stat.count),
      })),
    };
  }
}
