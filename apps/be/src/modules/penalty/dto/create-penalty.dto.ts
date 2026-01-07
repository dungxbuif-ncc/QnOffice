import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePenaltyDto {
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsNumber()
  @IsNotEmpty()
  penalty_type_id: number;

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
  evidence_urls?: string[];

  @IsNumber()
  @IsOptional()
  campaign_id?: number;
}
