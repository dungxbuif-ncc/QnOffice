import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '@src/modules/order/entities/order.entity';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingEntity } from './entities/billing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillingEntity,
      OrderEntity,
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
