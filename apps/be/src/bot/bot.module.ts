import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NezonModule } from '@nezon';
import { ChannelMessageHandler } from '@src/bot/handler/channel-message.handler';
import { DatabaseModule } from '@src/common/database/database.module';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { SharedModule } from '@src/common/shared/shared.module';
import { BillingModule } from '@src/modules/billing/billing.module';
import { BotNotiModule } from '@src/modules/bot-noti/bot-noti.module';
import ChannelConfigEntity from '@src/modules/channel/channel-config.entity';
import { CleaningModule } from '@src/modules/cleaning/cleaning.module';
import { OrderModule } from '@src/modules/order/order.module';
import { StaffModule } from '@src/modules/staff/staff.module';
import { MezonClient } from 'mezon-sdk';
import { OrderHandler } from './handler/order.handler';
import { CleaningScheduleHandler } from './handler/schedule.handler';

@Module({
  imports: [
    SharedModule,
    NezonModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: async (config: AppConfigService) => config.botConfig,
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([ChannelConfigEntity]),
    StaffModule,
    CleaningModule,
    BotNotiModule,
    OrderModule,
    BillingModule,
  ],
  providers: [ChannelMessageHandler, CleaningScheduleHandler, OrderHandler],
})
export class BotModule {
  private readonly logger = new Logger('BotModule');

  constructor(private mezonClient: MezonClient) {
    this.mezonClient.on('ready', async () => {
      this.logger.log('🤖 Mezon Client is ready!');
    });
  }
}
