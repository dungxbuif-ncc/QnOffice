import { Injectable } from '@nestjs/common';
import { CleaningSeeder } from '@src/seeders/cleaning.seeder';
import { HolidaySeeder } from '@src/seeders/holiday.seeder';
import { OpentalkSeeder } from '@src/seeders/opentalk.seeder';
import { PenaltyTypeSeeder } from '@src/seeders/penalty-type.seeder';
import { StaffSeeder } from '@src/seeders/staff.seeder';
import { BranchSeeder } from './branch.seeder';

@Injectable()
export class DatabaseSeeder {
  constructor(
    private readonly branchSeeder: BranchSeeder,
    private readonly staffSeeder: StaffSeeder,
    private readonly opentalkSeeder: OpentalkSeeder,
    private readonly cleaningSeeder: CleaningSeeder,
    private readonly holidaySeeder: HolidaySeeder,
    private readonly penaltyTypeSeeder: PenaltyTypeSeeder,
  ) {}

  async seed(): Promise<void> {
    console.log('Starting database seeding...');

    try {
      await this.holidaySeeder.seed();
      await this.penaltyTypeSeeder.seed();
      await this.branchSeeder.seed();
      await this.staffSeeder.seed();
      await this.opentalkSeeder.seed();
      await this.cleaningSeeder.seed();
      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Error during database seeding:', error);
      throw error;
    }
  }
}
