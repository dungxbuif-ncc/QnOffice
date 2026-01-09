import { Inject, Logger, Module } from '@nestjs/common';
import { NezonModule } from '@nezon';
import { BotCronModule } from '@src/bot/cron/bot-cron.module';
import { BotHandler } from '@src/bot/handler/mezon-event.handler';
import { MezonClientService } from '@src/bot/mezon.service';
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
  providers: [
    {
      provide: 'MEZON_CLIENT',
      useFactory: async (config: AppConfigService) => {
        try {
          const client = new MezonClient(config.botConfig);
          await client.login();
          return client;
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      inject: [AppConfigService],
    },
    BotHandler,
    MezonClientService,
  ],
})
export class BotModule {
  private readonly logger = new Logger('BotModule');

  constructor(@Inject('MEZON_CLIENT') private mezonClient: MezonClient) {
    this.mezonClient.on('ready', async () => {
      this.logger.log('🤖 Mezon Client is ready!');
    });
  }
}
