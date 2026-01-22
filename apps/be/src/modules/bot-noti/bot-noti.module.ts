import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotNotiDeliveryService } from '@src/modules/bot-noti/bot-noti-delivery.service';
import ChannelConfigEntity from '@src/modules/channel/channel-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChannelConfigEntity])],
  providers: [BotNotiDeliveryService],
  exports: [BotNotiDeliveryService],
})
export class BotNotiModule {}
