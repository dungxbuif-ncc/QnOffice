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

  private formatMessage(message: any): string {
    if (typeof message === 'string') {
      return message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  log(
    message: any,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    const formattedMessage = this.formatMessage(message);
    super.log(formattedMessage, context);
    this.logToDatabase(
      LogLevel.LOG,
      formattedMessage,
      context,
      journeyId,
      metadata,
    );
  }

  error(
    message: any,
    trace?: string,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    const formattedMessage = this.formatMessage(message);
    super.error(formattedMessage, trace, context);
    this.logToDatabase(
      LogLevel.ERROR,
      formattedMessage,
      context,
      journeyId,
      metadata ? { ...metadata, trace } : { trace },
    );
  }

  warn(
    message: any,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    const formattedMessage = this.formatMessage(message);
    super.warn(formattedMessage, context);
    this.logToDatabase(
      LogLevel.WARN,
      formattedMessage,
      context,
      journeyId,
      metadata,
    );
  }

  debug(
    message: any,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    const formattedMessage = this.formatMessage(message);
    super.debug(formattedMessage, context);
    this.logToDatabase(
      LogLevel.DEBUG,
      formattedMessage,
      context,
      journeyId,
      metadata,
    );
  }

  verbose(
    message: any,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    const formattedMessage = this.formatMessage(message);
    super.verbose(formattedMessage, context);
    this.logToDatabase(
      LogLevel.TRACE,
      formattedMessage,
      context,
      journeyId,
      metadata,
    );
  }

  fatal(
    message: any,
    context?: string,
    journeyId?: string,
    metadata?: Record<string, any>,
  ): void {
    const formattedMessage = this.formatMessage(message);
    super.fatal(formattedMessage, context);
    this.logToDatabase(
      LogLevel.FATAL,
      formattedMessage,
      context,
      journeyId,
      metadata,
    );
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
