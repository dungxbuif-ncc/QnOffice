import { NestFactory } from '@nestjs/core';
import { SeederModule } from '@src/common/database/seeder.module';
import { DatabaseSeeder } from './common/database/seeders/database.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);

  try {
    const seeder = app.get(DatabaseSeeder);
    await seeder.seed();
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
