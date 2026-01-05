import { Injectable } from '@nestjs/common';
import { BranchSeeder } from './branch.seeder';

@Injectable()
export class DatabaseSeeder {
  constructor(private readonly branchSeeder: BranchSeeder) {}

  async seed(): Promise<void> {
    console.log('Starting database seeding...');

    try {
      await this.branchSeeder.seed();
      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Error during database seeding:', error);
      throw error;
    }
  }
}
