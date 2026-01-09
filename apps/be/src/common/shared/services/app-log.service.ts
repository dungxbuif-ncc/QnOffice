import { Injectable, Logger } from '@nestjs/common';
import { LogLevel } from '@qnoffice/shared';
import { AuditLogService } from '@src/modules/audit-log/audit-log.service';
import { CreateAuditLogDto } from '@src/modules/audit-log/dtos';

@Injectable()
export class AppLogService extends Logger {
  constructor(private readonly auditLogService: AuditLogService) {
    super();
  }

  private async logToDatabase(
    level: LogLevel,
    message: string,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const logData: CreateAuditLogDto = {
      level,
      message,
      context,
      journeyId,
      metadata,
    };

    await this.auditLogService.createLog(logData);
  }

  log(
    message: string,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    super.log(message, context);
    this.logToDatabase(LogLevel.LOG, message, context, journeyId, metadata);
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    super.error(message, trace, context);
    this.logToDatabase(
      LogLevel.ERROR,
      message,
      context,
      journeyId,
      metadata ? { ...metadata, trace } : { trace },
    );
  }

  warn(
    message: string,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    super.warn(message, context);
    this.logToDatabase(LogLevel.WARN, message, context, journeyId, metadata);
  }

  debug(
    message: string,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    super.debug(message, context);
    this.logToDatabase(LogLevel.DEBUG, message, context, journeyId, metadata);
  }

  verbose(
    message: string,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    super.verbose(message, context);
    this.logToDatabase(LogLevel.TRACE, message, context, journeyId, metadata);
  }

  fatal(
    message: string,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    super.fatal(message, context);
    this.logToDatabase(LogLevel.FATAL, message, context, journeyId, metadata);
  }

  // Convenience methods for journey logging
  journeyLog(
    journeyId: string,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log(message, context, journeyId, metadata);
  }

  journeyError(
    journeyId: string,
    message: string,
    trace?: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.error(message, trace, context, journeyId, metadata);
  }

  journeyWarn(
    journeyId: string,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.warn(message, context, journeyId, metadata);
  }

  journeyDebug(
    journeyId: string,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.debug(message, context, journeyId, metadata);
  }

  // Step tracking for processes
  stepLog(
    step: number,
    message: string,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    const stepMessage = `Step ${step}: ${message}`;
    this.log(stepMessage, context, journeyId, {
      ...metadata,
      step,
      stepType: 'process',
    });
  }

  stepError(
    step: number,
    message: string,
    trace?: string,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    const stepMessage = `Step ${step} FAILED: ${message}`;
    this.error(stepMessage, trace, context, journeyId, {
      ...metadata,
      step,
      stepType: 'process',
    });
  }
}
