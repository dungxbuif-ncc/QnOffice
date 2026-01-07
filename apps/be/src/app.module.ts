import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@src/common/database/database.module';
import { SharedModule } from '@src/common/shared/shared.module';
import { HolidayModule } from '@src/modules/holiday/holiday.module';
import { StaffModule } from '@src/modules/staff/staff.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchModule } from './modules/branch/branch.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { CleaningModule } from './modules/cleaning/cleaning.module';
import { NotificationModule } from './modules/notification/notification.module';
import { OpentalkModule } from './modules/opentalk/opentalk.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    NestScheduleModule.forRoot(),
    NotificationModule,
    UserModule,
    BranchModule,
    AuthModule,
    StaffModule,
    HolidayModule,
    OpentalkModule,
    CleaningModule,
    CalendarModule,
    ScheduleModule,
  ],
})
export class AppModule {}
