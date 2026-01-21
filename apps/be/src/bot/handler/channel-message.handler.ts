import { Injectable } from '@nestjs/common';
import { NotificationEvent } from '@src/common/events/notification.events';
import { AutoContext, Nezon, On } from '@src/libs/nezon';
import EventEmitter2 from 'eventemitter2';
import { Events } from 'mezon-sdk';

@Injectable()
export class ChannelMessageHandler {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @On(Events.ChannelMessage)
  async onMessage(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    const message = managedMessage?.raw;
    if (!message) return;

    const user = {
      mezonId: message.sender_id,
      name: message.display_name,
      avatar: message.avatar,
    };

    this.eventEmitter.emit(NotificationEvent.USER_MESSAGE, user);
  }
}
