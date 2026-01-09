import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventStatus, ScheduleType } from '@qnoffice/shared';
import { getCurrentDateString } from '@src/common/utils/date.utils';
import { LessThan, Repository } from 'typeorm';
import ScheduleEventEntity from '../enties/schedule-event.entity';

@Injectable()
export class OpentalkCronService {
  private readonly logger = new Logger(OpentalkCronService.name);

  constructor(
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    // @InjectRepository(OpentalkSlideEntity)
    // private readonly slideRepository: Repository<OpentalkSlideEntity>,
    // private readonly eventEmitter: EventEmitter2,
  ) {}

  async markPastEventsCompleted(): Promise<void> {
    this.logger.log('Running: Mark past opentalk events as completed');

    const today = getCurrentDateString();

    const result = await this.eventRepository.update(
      {
        type: ScheduleType.OPENTALK,
        eventDate: LessThan(today),
        status: EventStatus.ACTIVE,
      },
      {
        status: EventStatus.COMPLETED,
      },
    );

    this.logger.log(`Marked ${result.affected} opentalk events as completed`);
  }

  async checkSlideSubmission(): Promise<void> {}
}
