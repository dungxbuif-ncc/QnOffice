import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@src/modules/schedule/schedule.module';
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
export class StaffModule {}
