import { ICreatePenaltyDto } from '@qnoffice/shared';
import {
    IsArray,
    IsDateString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreatePenaltyDto implements ICreatePenaltyDto {
  @IsNumber()
  @IsNotEmpty()
  staffId: number;

  @IsNumber()
  @IsNotEmpty()
  penaltyTypeId: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number; // If not provided, use penalty type's default amount

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidenceUrls?: string[];
}
