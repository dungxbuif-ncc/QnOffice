import { Injectable } from '@nestjs/common';
import { WHITE_LIST_CHANNEL } from '@src/common/constants/mezon';
import { NotificationEvent } from '@src/common/events/notification.events';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import type { Nezon } from '@src/libs/nezon';
import { AutoContext, Command } from '@src/libs/nezon';
import { SmartMessage } from '@src/libs/nezon/messaging/smart-message';
import { OrderService } from '@src/modules/order/order.service';
import EventEmitter2 from 'eventemitter2';

@Injectable()
export class OrderHandler {
  constructor(
    private appLogService: AppLogService,
    private readonly emitter: EventEmitter2,
    private readonly orderService: OrderService,
  ) {}

  @Command({ name: 'order' })
  async onOrder(@AutoContext() context: Nezon.AutoContext) {
    const [managedMessage] = context;
    const message = managedMessage?.raw;
    this.appLogService.log(message);
    if (message && WHITE_LIST_CHANNEL.DATCOM === message?.channel_id) {
      this.emitter.emit(NotificationEvent.ORDER_CREATED, message);
    }
  }

  @Command({ name: 'report', prefixes: ['qn'] })
  async onQnReport(@AutoContext() context: Nezon.AutoContext) {
    const [managedMessage] = context;
    const message = managedMessage?.raw;

    if (message?.channel_id !== WHITE_LIST_CHANNEL.DATCOM) {
      return;
    }
    try {
      const groupedOrders = await this.orderService.getOrdersGrouped();

      if (!groupedOrders || groupedOrders.length === 0) {
        await managedMessage.reply('Không có đơn hàng nào hôm nay.');
        return;
      }

      const datcomOrders = groupedOrders.find(
        (group) => group.channelId === WHITE_LIST_CHANNEL.DATCOM,
      );
      if (!datcomOrders || datcomOrders.sessions.length === 0) {
        await managedMessage.reply('Không có đơn hàng nào trong kênh DATCOM.');
        return;
      }
      for (const session of datcomOrders.sessions) {
        let sessionReport = '';
        for (const order of session.orders) {
          const username = order.user?.name || 'Unknown';
          sessionReport += `<${username}> order ${order.content}\n`;
        }
        await managedMessage.reply(SmartMessage.system(sessionReport.trim()));
      }
    } catch (error) {
      this.appLogService.error('Error generating report:', error);
      await managedMessage.reply('Có lỗi xảy ra khi tạo báo cáo.');
    }
  }
}
