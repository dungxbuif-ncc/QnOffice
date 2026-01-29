import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import * as Nezon from '@nezon';
import { MezonChannelType } from '@qnoffice/shared';
import {
  BillSendPayload,
  CleaningReminderPayload,
  EventParticipant,
  NotificationEvent,
  OpentalkSlideReminderPayload,
  OrderPaymentReminderPayload,
} from '@src/common/events/notification.events';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import ChannelConfigEntity from '@src/modules/channel/channel-config.entity';
import { MezonClient } from 'mezon-sdk';
import { Repository } from 'typeorm';

@Injectable()
export class BotNotiDeliveryService {
  constructor(
    @InjectRepository(ChannelConfigEntity)
    private readonly channelConfigRepository: Repository<ChannelConfigEntity>,
    private readonly mezonService: MezonClient,
    private readonly appLogService: AppLogService,
  ) {}

  @OnEvent(NotificationEvent.CLEANING_MORNING_REMINDER)
  @OnEvent(NotificationEvent.CLEANING_AFTERNOON_REMINDER)
  @OnEvent(NotificationEvent.CLEANING_NEXT_DAY_REMINDER)
  async handleCleaningMorningReminder(
    payload: CleaningReminderPayload,
  ): Promise<void> {
    const { journeyId } = payload;
    const typeMap = {
      morning: 'buổi sáng',
      afternoon: 'buổi chiều',
      nextday: 'ngày mai',
    };
    const type = typeMap[payload.type];

    this.appLogService.journeyLog(
      journeyId,
      `Processing cleaning ${type} reminder`,
      'BotNotiDeliveryService',
      {
        eventId: payload.eventId,
        eventDate: payload.eventDate,
        reminderType: payload.type,
        participantCount: payload.participants.length,
        participants: payload.participants.map((p) => p.username),
      },
    );

    try {
      this.appLogService.stepLog(
        1,
        'Formatting cleaning reminder message',
        'BotNotiDeliveryService',
        journeyId,
        { reminderType: payload.type },
      );

      const message = this.formatCleaningMessage(
        payload.eventDate,
        type,
        payload.participants,
      );

      this.appLogService.stepLog(
        2,
        'Sending message to CLEANING channel',
        'BotNotiDeliveryService',
        journeyId,
        { channelType: 'CLEANING' },
      );

      await this.sendToChannel('CLEANING', message, journeyId);

      this.appLogService.journeyLog(
        journeyId,
        `✅ Successfully sent cleaning ${type} reminder`,
        'BotNotiDeliveryService',
        {
          eventId: payload.eventId,
          reminderType: payload.type,
          participantCount: payload.participants.length,
        },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        `❌ Failed to send cleaning ${type} reminder`,
        error.stack,
        'BotNotiDeliveryService',
        {
          error: error.message,
          eventId: payload.eventId,
          reminderType: payload.type,
        },
      );
    }
  }

  // ========== OPENTALK SLIDE REMINDERS ==========

  @OnEvent(NotificationEvent.OPENTALK_SLIDE_REMINDER)
  async handleOpentalkSlideReminder(
    payload: OpentalkSlideReminderPayload,
  ): Promise<void> {
    const { journeyId } = payload;

    this.appLogService.journeyLog(
      journeyId,
      'Processing opentalk slide reminder',
      'BotNotiDeliveryService',
      {
        eventId: payload.eventId,
        eventDate: payload.eventDate,
        daysUntilEvent: payload.daysUntilEvent,
        recipient: payload.participant.username,
        slideSubmitted: payload.slideSubmitted,
      },
    );

    // Only send reminder if slide NOT submitted
    if (payload.slideSubmitted) {
      this.appLogService.journeyLog(
        journeyId,
        'Skipping reminder - slide already submitted',
        'BotNotiDeliveryService',
        {
          eventId: payload.eventId,
          recipient: payload.participant.username,
        },
      );
      return;
    }

    try {
      this.appLogService.stepLog(
        1,
        'Formatting opentalk slide reminder message',
        'BotNotiDeliveryService',
        journeyId,
        {
          recipient: payload.participant.username,
          daysUntilEvent: payload.daysUntilEvent,
        },
      );

      const message = this.formatSlideReminderMessage(
        payload.eventDate,
        payload.daysUntilEvent,
        payload.participant,
      );

      this.appLogService.stepLog(
        2,
        'Sending message to OPENTALK channel',
        'BotNotiDeliveryService',
        journeyId,
        { channelType: 'OPENTALK' },
      );

      await this.sendToChannel('OPENTALK', message, journeyId);

      this.appLogService.journeyLog(
        journeyId,
        '✅ Successfully sent opentalk slide reminder',
        'BotNotiDeliveryService',
        {
          eventId: payload.eventId,
          recipient: payload.participant.username,
        },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Failed to send opentalk slide reminder',
        error.stack,
        'BotNotiDeliveryService',
        {
          error: error.message,
          eventId: payload.eventId,
          recipient: payload.participant.username,
        },
      );
    }
  }

  @OnEvent(NotificationEvent.ORDER_PAYMENT_REMINDER)
  async handleOrderPaymentReminder(
    payload: OrderPaymentReminderPayload,
  ): Promise<void> {
    const { journeyId } = payload;

    this.appLogService.journeyLog(
      journeyId,
      'Processing order payment reminder',
      'BotNotiDeliveryService',
      {
        date: payload.date,
        channelId: payload.channelId,
        totalOrders: payload.orders.length,
      },
    );

    try {
      this.appLogService.stepLog(
        1,
        `Formatting payment reminder for ${payload.orders.length} orders`,
        'BotNotiDeliveryService',
        journeyId,
        {
          channelId: payload.channelId,
          orderCount: payload.orders.length,
        },
      );

      const message = this.formatOrderPaymentMessage(
        payload.date,
        payload.orders,
      );

      this.appLogService.stepLog(
        2,
        `Sending payment reminder to channel ${payload.channelId}`,
        'BotNotiDeliveryService',
        journeyId,
        { channelId: payload.channelId },
      );

      await this.sendToSpecificChannel(payload.channelId, message, journeyId);

      this.appLogService.journeyLog(
        journeyId,
        `✅ Successfully sent payment reminder for ${payload.orders.length} orders`,
        'BotNotiDeliveryService',
        {
          orderCount: payload.orders.length,
          channelId: payload.channelId,
          date: payload.date,
        },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Failed to send order payment reminder',
        error.stack,
        'BotNotiDeliveryService',
        {
          error: error.message,
          date: payload.date,
          channelId: payload.channelId,
        },
      );
    }
  }

  private async sendToChannel(
    channelType: MezonChannelType,
    message: Nezon.SmartMessage,
    journeyId?: string,
  ): Promise<void> {
    this.appLogService.stepLog(
      1,
      'Looking up channel configuration',
      'BotNotiDeliveryService',
      journeyId,
      { channelType },
    );

    const channelConfig = await this.channelConfigRepository.findOne({
      where: { channelType, isActive: true },
    });

    if (!channelConfig) {
      throw new Error(`Channel config not found for type: ${channelType}`);
    }
    const channelId = channelConfig.channelId;

    this.appLogService.stepLog(
      2,
      'Fetching channel from Mezon',
      'BotNotiDeliveryService',
      journeyId,
      { channelId, channelType },
    );

    const channel = await this.mezonService.channels.fetch(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const payload = message.toJSON();

    this.appLogService.stepLog(
      3,
      'Sending message to channel',
      'BotNotiDeliveryService',
      journeyId,
      {
        channelId,
        channelType,
        contentLength: (payload.content as string | undefined)?.length || 0,
        mentionCount: Array.isArray(payload.mentions)
          ? payload.mentions.length
          : 0,
        attachmentCount: Array.isArray(payload.attachments)
          ? payload.attachments.length
          : 0,
      },
    );

    await channel.send(payload.content, payload.mentions, payload.attachments);
  }

  private async sendToSpecificChannel(
    channelId: string,
    message: Nezon.SmartMessage,
    journeyId?: string,
  ): Promise<void> {
    this.appLogService.stepLog(
      1,
      'Fetching specific channel from Mezon',
      'BotNotiDeliveryService',
      journeyId,
      { channelId },
    );

    const channel = await this.mezonService.channels.fetch(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const payload = message.toJSON();

    this.appLogService.stepLog(
      2,
      'Sending message to specific channel',
      'BotNotiDeliveryService',
      journeyId,
      {
        channelId,
        contentLength: (payload.content as string | undefined)?.length || 0,
        mentionCount: Array.isArray(payload.mentions)
          ? payload.mentions.length
          : 0,
        attachmentCount: Array.isArray(payload.attachments)
          ? payload.attachments.length
          : 0,
      },
    );

    await channel.send(payload.content, payload.mentions, payload.attachments);
  }

  private formatCleaningMessage(
    eventDate: string,
    dayPart: string,
    assignees: EventParticipant[],
  ): Nezon.SmartMessage {
    return Nezon.SmartMessage.text(
      `Nhắc nhở trực nhật ${dayPart}: ${eventDate}\n ${assignees.map((assignee) => `{{${assignee.username}}}`).join(' ')}`,
    )
      .addMention({
        ...assignees.reduce(
          (acc, assignee) => {
            acc[assignee.username] = {
              userId: assignee.userId,
              username: assignee.username,
            };
            return acc;
          },
          {} as Record<string, EventParticipant>,
        ),
      })
      .addEmbed(
        new Nezon.EmbedBuilder()
          .setTitle(`Nhắc nhở trực nhật buổi ${dayPart}: ${eventDate}`)
          .setDescription(
            `
✅ 1. Vệ sinh Diễm (2 lần/ngày – sáng trước giờ làm & chiều trước khi ra về).
       -> Vệ sinh khay nước sạch – nước dơ ; bộ lọc bụi; bánh xe; chổi cuốn,chổi cạnh; đổ túi rác của Diễm.
       -> Tránh thấm nước vào trong khi lau Diễm bằng khăn, giẻ lau phơi khô hoàn toàn trước khi lắp lại (quan trọng)
✅ 2. Lau dọn pantry, hành lang bên ngoài.
✅ 3. Cuối ngày, Thu gom rác và mang xuống thùng rác cạnh trường học + thay túi mới. (Thùng rác ở VP và hành lang)
✅ 4. Trước khi ra về, mọi người vui lòng kiểm tra và kê lại ghế ngồi gọn gàng (tại khu làm việc và pantry) để robot làm việc.
✅ 5. Vệ sinh lò vi sóng, tủ lạnh (thực hiện vào mỗi thứ 6).
`,
          )
          .setFooter(
            'Bộ phận nhân sự Quy Nhơn - Hãy hoàn thành đầy đủ các mục trên!',
          ),
      );
  }

  private formatSlideReminderMessage(
    eventDate: string,
    daysUntilEvent: number,
    recipient: {
      userId: string;
      username: string;
    },
  ): Nezon.SmartMessage {
    return Nezon.SmartMessage.text(
      `Chào buổi sáng {{recipient}}\nBạn chưa nộp slide cho thuyết trình Opentalk 📅 Ngày: ${eventDate}\nDiễn ra vào ${daysUntilEvent} ngày tới\nVui lòng nộp slide tại: https://office.nccquynhon.edu.vn\n`,
    ).addMention({
      recipient,
    });
  }

  @OnEvent(NotificationEvent.BILL_SEND)
  async handleBillSend(payload: BillSendPayload): Promise<void> {
    const { journeyId } = payload;

    this.appLogService.journeyLog(
      journeyId,
      'Processing bill send notification',
      'BotNotiDeliveryService',
      {
        billingId: payload.billingId,
        date: payload.date,
        channelId: payload.channelId,
        totalOrders: payload.orders.length,
      },
    );

    try {
      this.appLogService.stepLog(
        1,
        `Formatting bill send message for ${payload.orders.length} orders`,
        'BotNotiDeliveryService',
        journeyId,
        {
          billingId: payload.billingId,
          orderCount: payload.orders.length,
        },
      );

      const message = this.formatBillSendMessage(payload);

      this.appLogService.stepLog(
        2,
        `Sending bill message to channel ${payload.channelId}`,
        'BotNotiDeliveryService',
        journeyId,
        { channelId: payload.channelId },
      );

      await this.sendToSpecificChannel(payload.channelId, message, journeyId);

      this.appLogService.journeyLog(
        journeyId,
        `✅ Successfully sent bill #${payload.billingId} to channel`,
        'BotNotiDeliveryService',
        {
          billingId: payload.billingId,
          orderCount: payload.orders.length,
          channelId: payload.channelId,
          owner: payload.owner.username,
        },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Failed to send bill notification',
        error.stack,
        'BotNotiDeliveryService',
        {
          error: error.message,
          billingId: payload.billingId,
          channelId: payload.channelId,
        },
      );
    }
  }

  private formatOrderPaymentMessage(
    date: string,
    orders: { userId: string; username: string; content: string }[],
  ): Nezon.SmartMessage {
    const userMentions = orders.reduce(
      (acc, order) => {
        acc[order.username] = {
          userId: order.userId,
          username: order.username,
        };
        return acc;
      },
      {} as Record<string, { userId: string; username: string }>,
    );

    const orderList = orders
      .map(
        (order, index) =>
          `${index + 1}. {{${order.username}}}: ${order.content}`,
      )
      .join('\n');

    return Nezon.SmartMessage.text(
      `🍽️ Đừng quên thanh toán orders - 📅 Ngày ${date}\n\n${orderList}\n\n💰 Vui lòng thanh toán cho người đặt hàng!`,
    ).addMention(userMentions);
  }

  private formatBillSendMessage(payload: BillSendPayload): Nezon.SmartMessage {
    const { owner, orders, date } = payload;

    const allMentions: Record<string, { userId: string; username: string }> = {
      owner: {
        userId: owner.userId,
        username: owner.username,
      },
    };

    // Add all order users to mentions
    orders.forEach((order) => {
      allMentions[order.username] = {
        userId: order.userId,
        username: order.username,
      };
    });

    // Format order list with mentions and amounts
    const orderList = orders
      .map(
        (order, index) =>
          `${index + 1}. {{${order.username}}}: ${order.content} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}`,
      )
      .join('\n');

    return Nezon.SmartMessage.text(
      `Em ${owner.username} sshin phép gửi bill hôm nay (${date}):\n${orderList}`,
    ).addMention(allMentions);
  }
}
