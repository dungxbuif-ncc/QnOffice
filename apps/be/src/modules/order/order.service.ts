import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupedOrder, SearchOrder } from '@qnoffice/shared';
import { NotificationEvent } from '@src/common/events/notification.events';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import {
  formatDateVn,
  formatVn,
  isWithinMinutes
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
    if (
      latestOrder &&
      isWithinMinutes(latestOrder.createdAt, new Date())
    ) {
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

  async getOrdersGrouped(
    query?: GetOrdersGroupedDto,
  ): Promise<GroupedOrder[]> {
    const startDate = query?.startDate || formatDateVn(new Date());
    const endDate = query?.endDate || startDate;

    const where: FindOptionsWhere<OrderEntity> = {};
    if (startDate === endDate) {
      where.date = startDate;
    } else {
      where.date = Between(startDate, endDate);
    }

    const orders = await this.orderRepository.find({
      relations: ['user'],
      where,
      order: {
        channelId: SearchOrder.ASC,
        createdAt: SearchOrder.DESC,
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

    // Group by session within channel
    for (const [channelId, channelOrders] of ordersByChannel) {
      const sessions: { orders: any[] }[] = []; // using any[] to bypass strict check for now, or assume compatibility
      let currentSession: OrderEntity[] = [];

      for (const order of channelOrders) {
        if (currentSession.length === 0) {
          currentSession.push(order);
          continue;
        }

        const lastOrderInSession = currentSession[currentSession.length - 1];
        
        // Since orders are DESC, lastOrderInSession is NEWER than 'order'.
        if (isWithinMinutes(order.createdAt, lastOrderInSession.createdAt)) {
          currentSession.push(order);
        } else {
          sessions.push({ orders: currentSession });
          currentSession = [order];
        }
      }
      if (currentSession.length > 0) {
        sessions.push({ orders: currentSession });
      }

      groupedOrders.push({ channelId, sessions: sessions as any });
    }

    return groupedOrders;
  }

  private trimMessage(message: ChannelMessageContent): string {
    const text = message?.t;
    if (!text) {
      return '';
    }
    return text?.replace('*order', '')?.trim();
  }
}
