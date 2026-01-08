import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import OpentalkSlideSubmissionEntity from '../entities/opentalk-slide-submission.entity';

@EventSubscriber()
export class OpentalkSlideSubscriber
  implements EntitySubscriberInterface<OpentalkSlideSubmissionEntity>
{
  private eventEmitter: EventEmitter2;

  constructor(dataSource: DataSource, eventEmitter: EventEmitter2) {
    if (dataSource?.subscribers) {
      dataSource.subscribers.push(this);
    }
    this.eventEmitter = eventEmitter;
  }

  listenTo() {
    return OpentalkSlideSubmissionEntity;
  }

  afterInsert(event: InsertEvent<OpentalkSlideSubmissionEntity>) {
    const entity = event.entity;
    if (!entity || !this.eventEmitter) return;

    this.eventEmitter.emit('opentalk.slide.submitted', {
      entity,
      eventId: entity.eventId,
    });
  }

  afterUpdate(event: UpdateEvent<OpentalkSlideSubmissionEntity>) {
    const entity = event.entity as OpentalkSlideSubmissionEntity;
    if (!entity || !this.eventEmitter) return;

    this.eventEmitter.emit('opentalk.slide.updated', {
      entity,
      eventId: entity.eventId,
    });
  }
}
