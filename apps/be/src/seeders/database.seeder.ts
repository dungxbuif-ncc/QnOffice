import { Injectable } from '@nestjs/common';
import { HolidaySeeder } from '@src/seeders/holiday.seeder';
import { OpentalkSeeder } from '@src/seeders/opentalk.seeder';
import { StaffSeeder } from '@src/seeders/staff.seeder';
import { BranchSeeder } from './branch.seeder';

@Injectable()
export class DatabaseSeeder {
  constructor(
    private readonly branchSeeder: BranchSeeder,
    private readonly staffSeeder: StaffSeeder,
    private readonly opentalkSeeder: OpentalkSeeder,
    private readonly holidaySeeder: HolidaySeeder,
  ) {}

  async seed(): Promise<void> {
    console.log('Starting database seeding...');

    try {
      await this.holidaySeeder.seed();
      await this.branchSeeder.seed();
      await this.staffSeeder.seed();
      await this.opentalkSeeder.seed();
      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Error during database seeding:', error);
      throw error;
    }
  }
}
