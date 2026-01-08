import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { BotModule } from '@src/bot/bot.module';
import bootstrapConfig from '@src/common/configs/boostrap-config';

export async function bootstrap(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(BotModule);

  await bootstrapConfig(app);
  await app.init();
  Logger.log('🤖 Bot service running!');
  return app;
}
void bootstrap();

process.on('unhandledRejection', (reason, promise) => {
  Logger.error(
    `Unhandled Rejection at: ${promise}, reason: ${reason}`,
    '',
    'UnhandledRejection',
  );
});

process.on('uncaughtException', (error) => {
  Logger.error(`Uncaught Exception: ${error.message}`, '', 'UncaughtException');
});
