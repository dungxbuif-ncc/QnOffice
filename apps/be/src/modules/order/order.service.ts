import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupedOrder, SearchOrder } from '@qnoffice/shared';
import { WHITE_LIST_CHANNEL } from '@src/common/constants/mezon';
import {
  NotificationEvent,
  OrderPaymentReminderPayload,
} from '@src/common/events/notification.events';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import {
  formatDateVn,
  formatVn,
  isWithinMinutes,
} from '@src/common/utils/time.util';
import { UserService } from '@src/modules/user/user.service';
import { ChannelMessage, ChannelMessageContent } from 'mezon-sdk';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersGroupedDto } from './dto/get-orders-grouped.dto';
import { OrderEntity } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly userService: UserService,
    private readonly appLogService: AppLogService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateOrderDto): Promise<OrderEntity> {
    const order = this.orderRepository.create(dto);
    return this.orderRepository.save(order);
  }

  async getUserLatestOrder(filter: {
    senderId: string;
    channelId?: string;
    date?: string;
  }): Promise<OrderEntity | null> {
    const { senderId, channelId, date } = filter;
    const query: FindOptionsWhere<OrderEntity> = {
      userMezonId: senderId,
    };
    if (channelId) {
      query.channelId = channelId;
    }
    if (date) {
      query.date = date;
    }

    return this.orderRepository.findOne({
      where: query,
      order: { createdAt: SearchOrder.DESC },
    });
  }

  @OnEvent(NotificationEvent.ORDER_CREATED)
  async handleOrderCreated(message: ChannelMessage) {
    const { sender_id, content, message_id, channel_id } = message;
    const user = await this.userService.findByMezonId(sender_id);
    if (!user) {
      this.appLogService.warn(
        `User with Mezon ID ${sender_id} not found`,
        OrderService.name,
      );
      return;
    }

    const latestOrder = await this.getUserLatestOrder({
      senderId: sender_id,
      channelId: channel_id,
      date: formatVn(new Date()),
    });
    let order: OrderEntity;
    const messageContent = this.trimMessage(content);
    if (latestOrder && isWithinMinutes(latestOrder.createdAt, new Date())) {
      order = latestOrder;
      order.content = messageContent;
    } else {
      order = this.orderRepository.create({
        userMezonId: sender_id,
        channelId: channel_id,
        date: formatDateVn(new Date()),
        content: messageContent,
        messageId: message_id,
      });
    }
    await this.orderRepository.save(order);
  }

  async getOrdersGrouped(query?: GetOrdersGroupedDto): Promise<GroupedOrder[]> {
    const startDate = query?.startDate || formatDateVn(new Date());
    const endDate = query?.endDate || startDate;

    const where: FindOptionsWhere<OrderEntity> = {};
    if (startDate === endDate) {
      where.date = startDate;
    } else {
      where.date = Between(startDate, endDate);
    }

    const orders = await this.orderRepository.find({
      relations: ['user', 'billing', 'billing.user'],
      where,
      order: {
        createdAt: SearchOrder.ASC,
      },
    });

    const groupedOrders: GroupedOrder[] = [];

    // Group by channel
    const ordersByChannel = new Map<string, OrderEntity[]>();
    for (const order of orders) {
      if (!order.channelId) continue;
      if (!ordersByChannel.has(order.channelId)) {
        ordersByChannel.set(order.channelId, []);
      }
      ordersByChannel.get(order.channelId)?.push(order);
    }

    for (const [channelId, channelOrders] of ordersByChannel) {
      const sessions: {
        orders: any[];
        billingId?: number;
        billingOwner?: string;
        billingDate?: string;
      }[] = [];

      const billedOrders = new Map<number, OrderEntity[]>();
      const unbilledOrders: OrderEntity[] = [];

      for (const order of channelOrders) {
        if (order.billingId) {
          if (!billedOrders.has(order.billingId)) {
            billedOrders.set(order.billingId, []);
          }
          billedOrders.get(order.billingId)?.push(order);
        } else {
          unbilledOrders.push(order);
        }
      }

      for (const [billingId, orders] of billedOrders) {
        const firstOrder = orders[0];
        const billing = firstOrder.billing;
        const billingOwner =
          billing?.user?.name ||
          billing?.user?.email ||
          billing?.userMezonId ||
          'Unknown';

        sessions.push({
          orders,
          billingId,
          billingOwner,
          billingDate: billing?.date ? (billing.date as any) : firstOrder.date,
        });
      }

      for (const order of unbilledOrders) {
        sessions.push({
          orders: [order],
        });
      }

      groupedOrders.push({ channelId, sessions: sessions as any });
    }

    return groupedOrders;
  }

  async findMostRecentOrder(
    userMezonId: string,
    channelId: string,
    date: string,
  ): Promise<OrderEntity | null> {
    return this.orderRepository.findOne({
      where: {
        userMezonId,
        channelId,
        date,
      },
      order: {
        createdAt: SearchOrder.DESC,
      },
    });
  }

  async deleteOrder(orderId: number): Promise<void> {
    await this.orderRepository.delete(orderId);
  }

  async sendPaymentReminder(journeyId: string): Promise<void> {
    this.appLogService.journeyLog(
      journeyId,
      'Starting order payment reminder process',
      'OrderService',
      { scheduleType: 'ORDER_PAYMENT' },
    );

    const today = formatDateVn(new Date());

    try {
      this.appLogService.stepLog(
        1,
        'Finding all orders for today in DATCOM channel',
        'OrderService',
        journeyId,
        { today, channelId: WHITE_LIST_CHANNEL.DATCOM },
      );

      const todayOrders = await this.orderRepository.find({
        where: { date: today, channelId: WHITE_LIST_CHANNEL.DATCOM,
          isPaid: false
         },
        relations: ['user'],
      });

      this.appLogService.stepLog(
        2,
        `Found ${todayOrders.length} orders for today in DATCOM channel`,
        'OrderService',
        journeyId,
        {
          count: todayOrders.length,
          today,
          channelId: WHITE_LIST_CHANNEL.DATCOM,
        },
      );

      if (todayOrders.length === 0) {
        this.appLogService.journeyLog(
          journeyId,
          'No orders found for today in DATCOM channel - skipping payment reminder',
          'OrderService',
          { today, channelId: WHITE_LIST_CHANNEL.DATCOM },
        );
        return;
      }

      const payload: OrderPaymentReminderPayload = {
        date: today,
        channelId: WHITE_LIST_CHANNEL.DATCOM,
        orders: todayOrders.map((order) => ({
          userId: order.userMezonId,
          username: order.user?.name || 'Unknown',
          content: order.content,
        })),
        journeyId,
      };

      this.appLogService.stepLog(
        3,
        'Emitting payment reminder event',
        'OrderService',
        journeyId,
        {
          totalOrders: todayOrders.length,
          channelId: WHITE_LIST_CHANNEL.DATCOM,
        },
      );

      this.eventEmitter.emit(NotificationEvent.ORDER_PAYMENT_REMINDER, payload);

      this.appLogService.journeyLog(
        journeyId,
        `✅ Successfully sent payment reminder for ${todayOrders.length} orders`,
        'OrderService',
        {
          totalOrders: todayOrders.length,
          channelId: WHITE_LIST_CHANNEL.DATCOM,
          today,
        },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Error sending payment reminder',
        error.stack,
        'OrderService',
        { error: error.message, today },
      );
    }
  }

  private trimMessage(message: ChannelMessageContent): string {
    const text = message?.t;
    if (!text) {
      return '';
    }
    return text?.replace('*order', '')?.trim();
  }
}
