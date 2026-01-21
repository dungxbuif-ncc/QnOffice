import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { formatDateVn } from '@src/common/utils/time.util';
import { OrderEntity } from '@src/modules/order/entities/order.entity';
import UserEntity from '@src/modules/user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderSeeder {
  private readonly logger = new Logger(OrderSeeder.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting order seeding...');

    const users = await this.userRepository.find();
    if (users.length === 0) {
      this.logger.warn('No users found. Order seeding aborted.');
      return;
    }

    const startDate = new Date('2026-01-01T00:00:00+07:00');
    const endDate = new Date('2026-01-21T23:59:59+07:00');
    const channelIds = ['1839678122394550272', '1839678122394550273'];

    const ordersToSave: OrderEntity[] = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = formatDateVn(d);

      for (const channelId of channelIds) {
        // Create 2 sessions per day
        const sessions = [
          { hour: 11, min: 0 }, // Lunch start
          { hour: 17, min: 0 }, // Dinner start
        ];

        for (const session of sessions) {
          // Decide if session happens (70% chance)
          if (Math.random() > 0.7) continue;

          const sessionBaseTime = new Date(d);
          sessionBaseTime.setHours(session.hour, session.min, 0, 0);

          // Pick random users for this session (30% of users)
          const sessionUsers = users.filter(() => Math.random() > 0.7);

          let orderTime = new Date(sessionBaseTime);

          for (const user of sessionUsers) {
            // Increment time by 1-10 mins to simulate chat flow
            orderTime = new Date(
              orderTime.getTime() + Math.floor(Math.random() * 10) * 60000,
            );

            const order = this.orderRepository.create({
              userMezonId: user.mezonId,
              channelId: channelId,
              date: dateStr,
              content: `Món ăn ${Math.floor(Math.random() * 100)}`,
              messageId: Math.random().toString(36).substring(7),
              createdAt: orderTime,
            });
            ordersToSave.push(order);
          }
        }
      }
    }

    if (ordersToSave.length > 0) {
      await this.orderRepository.save(ordersToSave);
      this.logger.log(`✓ Created ${ordersToSave.length} orders in batch`);
    } else {
      this.logger.warn('No orders were created');
    }

    this.logger.log('Order seeding completed!');
  }
}
