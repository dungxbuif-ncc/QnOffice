import { Injectable } from '@nestjs/common';
import { NotificationEvent } from '@src/common/events/notification.events';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import type { Nezon } from '@src/libs/nezon';
import { AutoContext, Command } from '@src/libs/nezon';
import EventEmitter2 from 'eventemitter2';

const datacomChannels =[`1841290471456903168`]

@Injectable()
export class OrderHandler {
  constructor(
    private appLogService: AppLogService,
    private readonly emitter: EventEmitter2,
  ) {}

  @Command({ name: 'order' })
  async onOrder(@AutoContext() context: Nezon.AutoContext) {
    const [managedMessage] = context;
    const message = managedMessage?.raw;
    this.appLogService.log(message);
    if (message && datacomChannels.includes(message?.channel_id)) {
      this.emitter.emit(NotificationEvent.ORDER_CREATED, message);
    }
  }
}
