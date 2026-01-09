import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import { ScheduleModule } from '@src/modules/schedule/schedule.module';
import { OpentalkStaffService } from '@src/modules/schedule/services/opentalk-staff.schedule.service';
import { StaffController } from '@src/modules/staff/staff.controller';
import StaffEntity from '@src/modules/staff/staff.entity';
import { StaffService } from '@src/modules/staff/staff.service';
import { StaffSubscriber } from '@src/modules/staff/subscribers/staff.subscriber';
import { UserModule } from '@src/modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffEntity]),
    UserModule,
    ScheduleModule,
  ],
  controllers: [StaffController],
  providers: [StaffService, StaffSubscriber],
  exports: [StaffService],
})
export class StaffModule implements OnModuleInit {
  constructor(
    private readonly staffSubscriber: StaffSubscriber,
    private readonly opentalkStaffService: OpentalkStaffService,
    private readonly appLogService: AppLogService,
  ) {}

  onModuleInit() {
    this.staffSubscriber.setOpentalkStaffService(this.opentalkStaffService);
    this.staffSubscriber.setAppLogService(this.appLogService);
  }
}
