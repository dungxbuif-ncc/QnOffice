import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import entities from '@src/common/database/entities';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { SharedModule } from '@src/common/shared/shared.module';

import { OpentalkSlideSubscriber } from '@src/modules/opentalk/subscribers/opentalk-slide.subscriber';
import { BranchSeeder } from '@src/seeders/branch.seeder';
import { CleaningSeeder } from '@src/seeders/cleaning.seeder';
import { DatabaseSeeder } from '@src/seeders/database.seeder';
import { HolidaySeeder } from '@src/seeders/holiday.seeder';
import { OpentalkSeeder } from '@src/seeders/opentalk.seeder';
import { PenaltyTypeSeeder } from '@src/seeders/penalty-type.seeder';
import { StaffSeeder } from '@src/seeders/staff.seeder';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: AppConfigService) =>
        configService.postgreSeedConfig,
      inject: [AppConfigService],
    }),
    TypeOrmModule.forFeature(entities),
    EventEmitterModule.forRoot(),
  ],
  providers: [
    BranchSeeder,
    StaffSeeder,
    HolidaySeeder,
    OpentalkSeeder,
    CleaningSeeder,
    PenaltyTypeSeeder,
    DatabaseSeeder,
    OpentalkSlideSubscriber,
  ],
  exports: [DatabaseSeeder],
})
export class SeederModule {}
