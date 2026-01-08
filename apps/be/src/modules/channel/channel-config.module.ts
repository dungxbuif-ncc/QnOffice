import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelConfigController } from './channel-config.controller';
import ChannelConfigEntity from './channel-config.entity';
import { ChannelConfigService } from './channel-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChannelConfigEntity])],
  controllers: [ChannelConfigController],
  providers: [ChannelConfigService],
  exports: [ChannelConfigService],
})
export class ChannelConfigModule {}
