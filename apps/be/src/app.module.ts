import { Logger, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { BotModule } from '@src/bot/bot.module';
import { DatabaseModule } from '@src/common/database/database.module';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { SharedModule } from '@src/common/shared/shared.module';
import { NezonModule } from '@src/libs/nezon';
import { BotNotiModule } from '@src/modules/bot-noti/bot-noti.module';
import { CronModule } from '@src/modules/cron/cron.module';
import { FeedbackModule } from '@src/modules/feedback/feedback.module';
import { HolidayModule } from '@src/modules/holiday/holiday.module';
import { PantryMenuModule } from '@src/modules/pantry-menu/pantry-menu.module';
import { PantryTransactionModule } from '@src/modules/pantry-transaction/pantry-transaction.module';
import { StaffModule } from '@src/modules/staff/staff.module';
import { MezonClient } from 'mezon-sdk';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchModule } from './modules/branch/branch.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ChannelConfigModule } from './modules/channel/channel-config.module';
import { CleaningModule } from './modules/cleaning/cleaning.module';
import { OpentalkModule } from './modules/opentalk/opentalk.module';
import { OrderModule } from './modules/order/order.module';
import { PenaltyTypeModule } from './modules/penalty-type/penalty-type.module';
import { PenaltyModule } from './modules/penalty/penalty.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { SwapRequestModule } from './modules/swap-request/swap-request.module';
import { UploadModule } from './modules/upload/upload.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
    NezonModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: async (config: AppConfigService) => config.botConfig,
    }),
    EventEmitterModule.forRoot(),
    NestScheduleModule.forRoot(),
    UserModule,
    BranchModule,
    AuthModule,
    StaffModule,
    HolidayModule,
    OpentalkModule,
    CleaningModule,
    CalendarModule,
    ScheduleModule,
    SwapRequestModule,
    PenaltyModule,
    PenaltyTypeModule,
    UploadModule,
    ChannelConfigModule,
    CronModule,
    AuditLogModule,
    BotNotiModule,
    PantryMenuModule,
    PantryTransactionModule,
    FeedbackModule,
    OrderModule,
    BotModule,
  ],
})
export class AppModule {
  constructor(private mezonClient: MezonClient) {
    this.mezonClient.on('ready', async () => {
      Logger.log('🤖 Mezon Client is ready!');
    });
  }
}
