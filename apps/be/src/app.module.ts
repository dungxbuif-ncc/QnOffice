import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@src/common/database/database.module';
import { SeederModule } from '@src/common/database/seeder.module';
import { SharedModule } from '@src/common/shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchModule } from './modules/branch/branch.module';
import { CleaningScheduleModule } from './modules/cleaning-schedule/cleaning-schedule.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
    SeederModule,
    EventEmitterModule.forRoot(),
    UserModule,
    BranchModule,
    CleaningScheduleModule,
    AuthModule,
  ],
})
export class AppModule {}
