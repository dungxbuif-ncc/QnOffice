import { NestFactory } from '@nestjs/core';
import { DatabaseSeeder } from '@src/seeders/database.seeder';
import { SeederModule } from '@src/seeders/seeder.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seeder = app.get(DatabaseSeeder);
  await seeder.seed();
  app.close();
  process.exit(1);
}

bootstrap();
