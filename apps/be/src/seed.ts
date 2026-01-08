import { NestFactory } from '@nestjs/core';
import { DatabaseSeeder } from '@src/seeders/database.seeder';
import { SeederModule } from '@src/seeders/seeder.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);

  try {
    const seeder = app.get(DatabaseSeeder);
    await seeder.seed();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
