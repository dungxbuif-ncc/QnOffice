import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchEntity } from '@src/modules/branch/branch.entity';
import { DatabaseModule } from './database.module';
import { BranchSeeder, DatabaseSeeder } from './seeders';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([BranchEntity])],
  providers: [BranchSeeder, DatabaseSeeder],
  exports: [DatabaseSeeder],
})
export class SeederModule {}
