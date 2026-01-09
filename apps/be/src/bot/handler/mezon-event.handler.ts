/* eslint-disable @typescript-eslint/unbound-method */
import { Inject, Injectable } from '@nestjs/common';
import { MezonClientService } from '@src/bot/mezon.service';

import { ChannelMessage, MezonClient } from 'mezon-sdk';

@Injectable()
export class BotHandler {
  constructor(
    @Inject('MEZON_CLIENT') private botClient: MezonClient,
    // private emitter: EventEmitter2,
    private mezonService: MezonClientService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-misused-promises
    this.botClient.onChannelMessage(this.handleMessage.bind(this));
  }

  private async handleMessage(message: ChannelMessage): Promise<void> {
    await this.mezonService.sendReplyMessage(
      { messageContent: 'Không có đơn hàng nợ nào để xác nhận' },
      message,
    );
  }
}
