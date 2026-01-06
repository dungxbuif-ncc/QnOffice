import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@src/common/database/database.module';

import { BranchEntity } from '@src/modules/branch/branch.entity';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import ScheduleCycleEntity from '@src/modules/schedule/enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '@src/modules/schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import { BranchSeeder } from '@src/seeders/branch.seeder';
import { DatabaseSeeder } from '@src/seeders/database.seeder';
import { HolidaySeeder } from '@src/seeders/holiday.seeder';
import { OpentalkSeeder } from '@src/seeders/opentalk.seeder';
import { StaffSeeder } from '@src/seeders/staff.seeder';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([
      BranchEntity,
      StaffEntity,
      HolidayEntity,
      ScheduleCycleEntity,
      ScheduleEventEntity,
      ScheduleEventParticipantEntity,
    ]),
  ],
  providers: [
    BranchSeeder,
    StaffSeeder,
    HolidaySeeder,
    OpentalkSeeder,
    DatabaseSeeder,
  ],
  exports: [DatabaseSeeder],
})
export class SeederModule {}
