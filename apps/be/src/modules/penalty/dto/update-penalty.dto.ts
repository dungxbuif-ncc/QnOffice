import { PartialType } from '@nestjs/mapped-types';
import { PenaltyStatus } from '@qnoffice/shared';
import { IsEnum, IsOptional } from 'class-validator';
import { CreatePenaltyDto } from './create-penalty.dto';

export class UpdatePenaltyDto extends PartialType(CreatePenaltyDto) {
  @IsEnum(PenaltyStatus)
  @IsOptional()
  status?: PenaltyStatus;
}
