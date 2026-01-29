import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { SearchOrder } from '@qnoffice/shared';
import {
  BillSendPayload,
  NotificationEvent,
} from '@src/common/events/notification.events';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import { OrderEntity } from '@src/modules/order/entities/order.entity';
import { In, IsNull, Repository } from 'typeorm';
import { BillingEntity } from './entities/billing.entity';

export interface BillingResult {
  isEmpty?: boolean;
  isUpdateOwner?: boolean;
  isCreateBilling?: boolean;
  orders: OrderEntity[];
  billingId?: number;
}

import { WHITE_LIST_CHANNEL } from '@src/common/constants/mezon';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingEntity)
    private readonly billingRepository: Repository<BillingEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly appLogService: AppLogService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createBillingFromOrders(
    userMezonId: string,
    channelId: string,
    date: string,
  ): Promise<BillingResult> {
    this.appLogService.log(
      `Creating billing for user ${userMezonId} on ${date}`,
      'BillingService',
    );
    const userBilling = await this.billingRepository.findOne({
      where: {
        userMezonId,
        date,
      },
    });
    const orders = await this.orderRepository.find({
      where: {
        channelId,
        date,
      },
      relations: {
        user: true,
      },
      order: {
        createdAt: SearchOrder.DESC,
      },
    });

    if (orders.length === 0) {
      return {
        isEmpty: true,
        orders: [],
      };
    }

    if (orders[0].billingId) {
      await this.billingRepository.update(
        { id: orders[0].billingId },
        { userMezonId },
      );
      return {
        isUpdateOwner: true,
        orders,
        billingId: orders[0].billingId,
      };
    }
    const unbilledOrders: OrderEntity[] = [];
    for (const order of orders) {
      if (order.billingId) {
        break;
      }
      unbilledOrders.push(order);
    }

    if (unbilledOrders.length === 0) {
      return {
        isEmpty: true,
        orders: [],
      };
    }
    if (userBilling) {
      const billingId = userBilling.id;
      await this.orderRepository.update(
        unbilledOrders.map((o) => o.id),
        { billingId },
      );
      return {
        isUpdateOwner: true,
        orders,
        billingId,
      };
    }
    const billing = this.billingRepository.create({
      userMezonId,
      channelId,
      date,
    });

    const savedBilling = await this.billingRepository.save(billing);
    const billingId = savedBilling.id;

    await this.orderRepository.update(
      unbilledOrders.map((o) => o.id),
      { billingId },
    );

    this.appLogService.log(
      `Created billing ${billingId} with ${unbilledOrders.length} orders`,
      'BillingService',
    );

    return {
      isCreateBilling: true,
      orders: unbilledOrders,
      billingId,
    };
  }

  async getMyBillings(
    userMezonId: string,
    month?: string,
  ): Promise<BillingEntity[]> {
    const query = this.billingRepository
      .createQueryBuilder('billing')
      .leftJoinAndSelect('billing.orders', 'orders')
      .leftJoinAndSelect('orders.user', 'orderUser')
      .leftJoinAndSelect('billing.user', 'user')
      .where('billing.userMezonId = :userMezonId', { userMezonId })
      .orderBy('billing.date', 'DESC')
      .addOrderBy('billing.createdAt', 'DESC');

    if (month) {
      query.andWhere("TO_CHAR(billing.date, 'YYYY-MM') = :month", { month });
    }

    return query.getMany();
  }
  async updateOrder(
    ownerId: string,
    billingId: number,
    orderId: string,
    updates: { isPaid?: boolean; amount?: number },
  ) {
    const oId = parseInt(orderId);
    const billing = await this.billingRepository.findOne({
      where: { id: billingId, userMezonId: ownerId },
    });
    if (!billing) {
      throw new ForbiddenException('You are not the owner of this billing');
    }

    const order = await this.orderRepository.findOne({
      where: { id: oId, billingId },
    });
    if (!order) {
      throw new NotFoundException('Order not found in this billing');
    }

    await this.orderRepository.update({ id: oId }, updates);
    return { success: true };
  }

  async removeOrderFromBilling(
    ownerId: string,
    billingId: number,
    orderId: string,
  ) {
    const oId = parseInt(orderId);
    const billing = await this.billingRepository.findOne({
      where: { id: billingId, userMezonId: ownerId },
    });
    if (!billing) {
      throw new ForbiddenException('You are not the owner of this billing');
    }

    const order = await this.orderRepository.findOne({
      where: { id: oId, billingId },
    });
    if (!order) {
      throw new NotFoundException('Order not found in this billing');
    }

    await this.orderRepository.update({ id: oId }, { billingId: null });
    return { success: true };
  }

  async getUnbilledOrders(
    ownerId: string,
    billingId: number,
  ): Promise<OrderEntity[]> {
    const billing = await this.billingRepository.findOne({
      where: { id: billingId, userMezonId: ownerId },
    });

    if (!billing) {
      throw new ForbiddenException('You are not the owner of this billing');
    }

    // Ensure date is string YYYY-MM-DD
    const billingDate =
      typeof billing.date === 'string'
        ? billing.date
        : (billing.date as any).toISOString().split('T')[0];

    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .where('order.channelId = :channelId', { channelId: billing.channelId })
      .andWhere('order.date = :date', { date: billingDate })
      .andWhere('order.billingId IS NULL')
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async addOrdersToBilling(
    ownerId: string,
    billingId: number,
    orderIds: string[],
  ) {
    if (!orderIds.length) return { success: true, count: 0 };

    const billing = await this.billingRepository.findOne({
      where: { id: billingId, userMezonId: ownerId },
    });

    if (!billing) {
      throw new ForbiddenException('You are not the owner of this billing');
    }

    // Only update orders that match context and are unbilled
    const validOrders = await this.orderRepository.find({
      where: {
        id: In(orderIds),
        channelId: billing.channelId,
        date: billing.date,
        billingId: IsNull(),
      },
    });

    if (validOrders.length > 0) {
      await this.orderRepository.update(
        validOrders.map((o) => o.id),
        { billingId },
      );
    }

    return { success: true, count: validOrders.length };
  }

  async sendBill(ownerId: string, billingId: number) {
    const journeyId = `bill-send-${billingId}-${Date.now()}`;

    this.appLogService.journeyLog(
      journeyId,
      'Starting bill send process',
      'BillingService',
      { billingId, ownerId },
    );

    try {
      this.appLogService.stepLog(
        1,
        'Fetching billing with unpaid orders',
        'BillingService',
        journeyId,
        { billingId },
      );

      // Use query builder to fetch billing with only unpaid orders
      const billing = await this.billingRepository
        .createQueryBuilder('billing')
        .leftJoinAndSelect('billing.user', 'user')
        .leftJoinAndSelect(
          'billing.orders',
          'orders',
          'orders.isPaid = :isPaid',
          { isPaid: false },
        )
        .leftJoinAndSelect('orders.user', 'orderUser')
        .where('billing.id = :billingId', { billingId })
        .andWhere('billing.userMezonId = :ownerId', { ownerId })
        .getOne();

      if (!billing) {
        this.appLogService.journeyError(
          journeyId,
          '❌ Billing not found or user is not the owner',
          '',
          'BillingService',
          { billingId, ownerId },
        );
        throw new ForbiddenException('You are not the owner of this billing');
      }

      if (!billing.orders || billing.orders.length === 0) {
        this.appLogService.journeyLog(
          journeyId,
          '✅ No unpaid orders found - all orders are paid',
          'BillingService',
          { billingId },
        );
        return { success: true, message: 'All orders are already paid' };
      }

      this.appLogService.stepLog(
        2,
        `Found ${billing.orders.length} unpaid orders`,
        'BillingService',
        journeyId,
        {
          billingId,
          unpaidOrders: billing.orders.length,
          date: billing.date,
        },
      );

      const payload: BillSendPayload = {
        billingId: billing.id,
        date: billing.date,
        channelId: WHITE_LIST_CHANNEL.DATCOM,
        owner: {
          userId: billing.userMezonId,
          username: billing.user?.name || 'Unknown',
        },
        orders: billing.orders.map((order) => ({
          userId: order.userMezonId,
          username: order.user?.name || 'Unknown',
          content: order.content,
          amount: order.amount || 0,
        })),
        journeyId,
      };

      this.appLogService.stepLog(
        3,
        'Emitting bill send event',
        'BillingService',
        journeyId,
        {
          billingId,
          orderCount: payload.orders.length,
          channelId: WHITE_LIST_CHANNEL.DATCOM,
        },
      );

      this.eventEmitter.emit(NotificationEvent.BILL_SEND, payload);

      this.appLogService.journeyLog(
        journeyId,
        `✅ Successfully emitted bill send event for billing #${billingId}`,
        'BillingService',
        {
          billingId,
          orderCount: payload.orders.length,
          owner: payload.owner.username,
        },
      );
    } catch (error) {
      this.appLogService.journeyError(
        journeyId,
        '❌ Error in sendBill',
        error.stack,
        'BillingService',
        { error: error.message, billingId, ownerId },
      );
      throw error;
    }
  }
}
