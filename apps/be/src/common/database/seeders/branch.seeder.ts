import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BranchEntity } from '@src/modules/branch/branch.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BranchSeeder {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
  ) {}

  async seed(): Promise<void> {
    // Check if branches already exist
    const existingBranches = await this.branchRepository.count();
    if (existingBranches > 0) {
      console.log('Branches already exist, skipping seeding...');
      return;
    }

    // Seed initial branches
    const branches = [
      {
        name: 'Quy Nhơn',
        code: 'QN',
        address: 'Quy Nhon City, Binh Dinh Province, Vietnam',
      },
    ];

    for (const branchData of branches) {
      const existingBranch = await this.branchRepository.findOne({
        where: { code: branchData.code },
      });

      if (!existingBranch) {
        const branch = this.branchRepository.create(branchData);
        await this.branchRepository.save(branch);
        console.log(`Created branch: ${branchData.name} (${branchData.code})`);
      } else {
        console.log(`Branch ${branchData.name} already exists, skipping...`);
      }
    }

    console.log('Branch seeding completed!');
  }
}
