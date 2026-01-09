import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import AuditLogEntity from '@src/modules/audit-log/audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogSearchParamsDto, CreateAuditLogDto } from './dtos';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new audit log entry' })
  async createLog(@Body() createDto: CreateAuditLogDto) {
    await this.auditLogService.createLog(createDto);
    return { message: 'Audit log created successfully' };
  }

  @Get()
  async findAll(
    @Query() searchParams: AuditLogSearchParamsDto,
  ): Promise<AppPaginationDto<AuditLogEntity>> {
    return this.auditLogService.findAll(searchParams);
  }

  @Get('journey/:journeyId')
  @ApiOperation({ summary: 'Get all logs for a specific journey' })
  async findByJourney(@Param('journeyId') journeyId: string) {
    return this.auditLogService.findByJourneyId(journeyId);
  }

  @Get('contexts')
  @ApiOperation({ summary: 'Get all available log contexts' })
  async getContexts() {
    return this.auditLogService.getContexts();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit log statistics' })
  async getStats() {
    return this.auditLogService.getLogStats();
  }

  @Delete('cleanup/:days')
  @ApiOperation({ summary: 'Delete audit logs older than specified days' })
  async cleanup(@Param('days') days: number) {
    const deletedCount = await this.auditLogService.deleteOldLogs(days);
    return { message: `Deleted ${deletedCount} audit log entries` };
  }
}
