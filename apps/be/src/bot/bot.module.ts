import { Logger, Module } from '@nestjs/common';
import { NezonModule } from '@nezon';
import { BotCronModule } from '@src/bot/cron/bot-cron.module';
import ChannelMessageHandler from '@src/bot/handler/channel-message.handler';
import { DatabaseModule } from '@src/common/database/database.module';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { SharedModule } from '@src/common/shared/shared.module';
import { MezonClient } from 'mezon-sdk';

@Module({
  imports: [
    SharedModule,
    NezonModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: async (config: AppConfigService) => config.botConfig,
    }),
    DatabaseModule,
    BotCronModule,
  ],
  providers: [ChannelMessageHandler],
})
export class BotModule {
  private readonly logger = new Logger('BotModule');

  constructor(private mezonClient: MezonClient) {
    this.mezonClient.on('ready', async () => {
      this.logger.log('🤖 Mezon Client is ready!');
    });
  }
}
