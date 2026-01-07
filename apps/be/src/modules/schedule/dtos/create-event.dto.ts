import { ScheduleType } from '@qnoffice/shared';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsEnum(ScheduleType)
  type: ScheduleType;

  @IsNumber()
  cycleId: number;

  @IsDateString()
  eventDate: string;

  @IsArray()
  @IsNumber({}, { each: true })
  participantIds: number[];

  @IsOptional()
  @IsString()
  notes?: string;
}
