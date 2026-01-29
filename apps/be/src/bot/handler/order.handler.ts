import { Injectable } from '@nestjs/common';
import { WHITE_LIST_CHANNEL } from '@src/common/constants/mezon';
import { NotificationEvent } from '@src/common/events/notification.events';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import joinUrlPaths from '@src/common/utils/joinUrlPaths';
import { formatDateVn } from '@src/common/utils/time.util';
import type { Nezon } from '@src/libs/nezon';
import { AutoContext, Command } from '@src/libs/nezon';
import { SmartMessage } from '@src/libs/nezon/messaging/smart-message';
import { BillingService } from '@src/modules/billing/billing.service';
import { OrderService } from '@src/modules/order/order.service';
import EventEmitter2 from 'eventemitter2';

@Injectable()
export class OrderHandler {
  constructor(
    private appLogService: AppLogService,
    private readonly emitter: EventEmitter2,
    private readonly orderService: OrderService,
    private readonly billingService: BillingService,
    private readonly appConfigService: AppConfigService,
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

  @Command({ name: 'cancel', prefixes: ['*order'] })
  async onOrderCancel(@AutoContext() context: Nezon.AutoContext) {
    const [managedMessage] = context;
    const message = managedMessage?.raw;

    if (message?.channel_id !== WHITE_LIST_CHANNEL.DATCOM) {
      return;
    }

    try {
      const userMezonId = message.sender_id;
      const channelId = message.channel_id;
      const today = formatDateVn(new Date());

      this.appLogService.log(
        `Cancelling order for user ${userMezonId} on ${today}`,
        'OrderHandler',
      );
      const recentOrder = await this.orderService.findMostRecentOrder(
        userMezonId,
        channelId,
        today,
      );
      if (!recentOrder) {
        await managedMessage.reply(
          SmartMessage.text('❌ Không tìm thấy đơn hàng nào hôm nay để hủy.'),
        );
        return;
      }

      await this.orderService.deleteOrder(recentOrder.id);

      await managedMessage.reply(
        SmartMessage.text(
          `✅ Đã hủy đơn hàng: "${recentOrder.content}"\n🕐 Thời gian: ${new Date(recentOrder.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
        ),
      );
    } catch (error) {
      this.appLogService.error('Error cancelling order:', error);
      await managedMessage.reply(
        SmartMessage.system(
          `❌ Lỗi: ${error.message || 'Không thể hủy đơn hàng'}`,
        ),
      );
    }
  }

  @Command({ name: 'report', prefixes: ['*qn'] })
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

  @Command({ name: 'finish', prefixes: ['*qn'] })
  async onQnFinish(@AutoContext() context: Nezon.AutoContext) {
    const [managedMessage] = context;
    const message = managedMessage?.raw;

    if (message?.channel_id !== WHITE_LIST_CHANNEL.DATCOM) {
      return;
    }

    try {
      const userMezonId = message.sender_id;
      const channelId = message.channel_id;
      const today = formatDateVn(new Date());

      this.appLogService.log(
        `Creating billing for user ${userMezonId} on ${today}`,
        'OrderHandler',
      );

      const result = await this.billingService.createBillingFromOrders(
        userMezonId,
        channelId,
        today,
      );
      const myBillUrl = joinUrlPaths(this.appConfigService.frontendUrl,'dashboard/my-bills')
      if (result.isEmpty) {
        await managedMessage.reply(
          SmartMessage.system(`❌ Không có đơn hàng nào trong ngày hôm nay.`),
        );
        return;
      }

      if (result.isUpdateOwner) {
        const orderList = result.orders
          .map((order, index) => `${index + 1}. ${order.content}`)
          .join('\n');
        await managedMessage.reply(
          SmartMessage.system(
            `ℹ️ Đã cập nhật chủ sở hữu cho đơn hàng!\n\n` +
              `Chi tiết:\n${orderList}\n` +
              `💡 Bạn có thể xem và quản lý billing tại:\n${myBillUrl}`,
          ),
        );
        return;
      }

      // Case 4: Successfully created new billing
      if (result.isCreateBilling) {
        const orderList = result.orders
          .map((order, index) => `${index + 1}. ${order.content}`)
          .join('\n');

        await managedMessage.reply(
          SmartMessage.system(
            `✅ Đã tạo billing thành công!\n\n` +
              `Chi tiết:\n${orderList}\n\n` +
              `💡 Bạn có thể xem và quản lý billing tại:\n${myBillUrl}`,
          ),
        );
        return;
      }
    } catch (error) {
      this.appLogService.error('Error creating billing:', error);
      await managedMessage.reply(
        SmartMessage.system(
          `❌ Lỗi: ${error.message || 'Không thể tạo billing'}`,
        ),
      );
    }
  }
}
