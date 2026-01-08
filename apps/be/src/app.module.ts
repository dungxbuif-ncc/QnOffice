import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@src/common/database/database.module';
import { NotificationListener } from '@src/common/listeners/notification.listener';
import { SharedModule } from '@src/common/shared/shared.module';
import { CronModule } from '@src/cron/cron.module';
import { HolidayModule } from '@src/modules/holiday/holiday.module';
import { StaffModule } from '@src/modules/staff/staff.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchModule } from './modules/branch/branch.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ChannelConfigModule } from './modules/channel/channel-config.module';
import { CleaningModule } from './modules/cleaning/cleaning.module';
import { OpentalkModule } from './modules/opentalk/opentalk.module';
import { PenaltyTypeModule } from './modules/penalty-type/penalty-type.module';
import { PenaltyModule } from './modules/penalty/penalty.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { UploadModule } from './modules/upload/upload.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
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
    PenaltyModule,
    PenaltyTypeModule,
    UploadModule,
    ChannelConfigModule,
    CronModule,
  ],
  providers: [NotificationListener],
})
export class AppModule {}
