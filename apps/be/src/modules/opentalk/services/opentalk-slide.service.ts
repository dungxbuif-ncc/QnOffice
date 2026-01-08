import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ScheduleType } from '@qnoffice/shared';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';
import { Repository } from 'typeorm';
import SubmitSlideDto from '../dtos/submit-slide.dto';
import OpentalkSlideSubmissionEntity from '../entities/opentalk-slide-submission.entity';

@Injectable()
export class OpentalkSlideService {
  private readonly logger = new Logger(OpentalkSlideService.name);

  constructor(
    @InjectRepository(OpentalkSlideSubmissionEntity)
    private readonly slideRepository: Repository<OpentalkSlideSubmissionEntity>,
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
  ) {}

  async submitSlide(
    dto: SubmitSlideDto,
    staffId: number,
  ): Promise<OpentalkSlideSubmissionEntity> {
    const event = await this.eventRepository.findOne({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.type !== ScheduleType.OPENTALK) {
      throw new Error('Event is not an OpenTalk event');
    }

    const existing = await this.slideRepository.findOne({
      where: { eventId: dto.eventId },
    });

    if (existing) {
      existing.slidesUrl = dto.slidesUrl;
      if (dto.topic) existing.topic = dto.topic;
      if (dto.notes) existing.notes = dto.notes;
      existing.submittedBy = staffId;
      return await this.slideRepository.save(existing);
    }

    const submission = this.slideRepository.create({
      eventId: dto.eventId,
      slidesUrl: dto.slidesUrl,
      topic: dto.topic,
      notes: dto.notes,
      submittedBy: staffId,
    });

    const saved = await this.slideRepository.save(submission);

    this.logger.log(
      `Slide submitted for event ${dto.eventId} by staff ${staffId}`,
    );

    return saved;
  }

  async getSlideSubmission(
    eventId: number,
  ): Promise<OpentalkSlideSubmissionEntity | null> {
    return await this.slideRepository.findOne({
      where: { eventId },
      relations: ['event', 'submitter'],
    });
  }

  async hasSlideSubmission(eventId: number): Promise<boolean> {
    const count = await this.slideRepository.count({
      where: { eventId },
    });
    return count > 0;
  }
}
