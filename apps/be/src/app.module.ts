import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@src/common/database/database.module';
import { SharedModule } from '@src/common/shared/shared.module';
import { HolidayModule } from '@src/modules/holiday/holiday.module';
import { StaffModule } from '@src/modules/staff/staff.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchModule } from './modules/branch/branch.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { CleaningModule } from './modules/cleaning/cleaning.module';
import { OpentalkModule } from './modules/opentalk/opentalk.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    UserModule,
    BranchModule,
    AuthModule,
    StaffModule,
    HolidayModule,
    OpentalkModule,
    CleaningModule,
    CalendarModule,
  ],
})
export class AppModule {}
