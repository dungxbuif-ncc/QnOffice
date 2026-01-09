import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import ChannelConfigEntity from '@src/modules/channel/channel-config.entity';
import { ScheduleModule } from '@src/modules/schedule/schedule.module';
import { BotCronService } from './bot-cron.service';

@Module({
  imports: [ScheduleModule, TypeOrmModule.forFeature([ChannelConfigEntity])],
  providers: [BotCronService],
})
export class BotCronModule {}
