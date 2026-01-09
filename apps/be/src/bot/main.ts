import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { BotModule } from '@src/bot/bot.module';
const logger = new Logger('BotService');
export async function bootstrap() {
  const app = await NestFactory.create(BotModule);
  await app.init();
}
void bootstrap();

process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    `Unhandled Rejection at: ${promise}, reason: ${reason}`,
    '',
    'UnhandledRejection',
  );
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, '', 'UncaughtException');
});
