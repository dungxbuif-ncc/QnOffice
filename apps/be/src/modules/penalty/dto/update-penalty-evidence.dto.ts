import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdatePenaltyEvidenceDto {
  @IsArray()
  @IsString({ each: true })
  evidence_urls: string[];

  @IsString()
  @IsOptional()
  reason?: string;
}
