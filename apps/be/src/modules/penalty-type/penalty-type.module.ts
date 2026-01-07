import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PenaltyTypeController } from './penalty-type.controller';
import { PenaltyType } from './penalty-type.entity';
import { PenaltyTypeService } from './penalty-type.service';

@Module({
  imports: [TypeOrmModule.forFeature([PenaltyType])],
  controllers: [PenaltyTypeController],
  providers: [PenaltyTypeService],
  exports: [PenaltyTypeService],
})
export class PenaltyTypeModule {}
