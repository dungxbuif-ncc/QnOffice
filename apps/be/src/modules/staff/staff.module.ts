import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffController } from '@src/modules/staff/staff.controller';
import StaffEntity from '@src/modules/staff/staff.entity';
import { StaffService } from '@src/modules/staff/staff.service';

@Module({
  imports: [TypeOrmModule.forFeature([StaffEntity])],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
