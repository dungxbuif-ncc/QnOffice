import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import UserEntity from '@src/modules/user/user.entity';
import { PantryTransactionController } from './pantry-transaction.controller';
import { PantryTransactionService } from './pantry-transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [PantryTransactionController],
  providers: [PantryTransactionService],
  exports: [PantryTransactionService],
})
export class PantryTransactionModule {}
