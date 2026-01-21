import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { SearchOrder } from '@qnoffice/shared';
import { NotificationEvent } from '@src/common/events/notification.events';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import {
  checkMinuteFrom,
  formatDateVn,
  formatVn,
} from '@src/common/utils/time.util';
import { UserService } from '@src/modules/user/user.service';
import { ChannelMessage, ChannelMessageContent } from 'mezon-sdk';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
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
      checkMinuteFrom({
        startTime: latestOrder.createdAt,
        endTime: new Date(),
      }) <= 30
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

  private trimMessage(message: ChannelMessageContent): string {
    const text = message?.t;
    if (!text) {
      return '';
    }
    return text?.replace('*order', '')?.trim();
  }
}
