import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { EventStatus } from '../../schedule/enties/schedule-event.entity';

export class CreateOpentalkEventDto {
  @ApiProperty({ description: 'Title of the opentalk event' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Type of event', default: 'OPENTALK' })
  @IsOptional()
  @IsString()
  type?: string = 'OPENTALK';

  @ApiProperty({ description: 'Cycle ID this event belongs to' })
  @IsNumber()
  cycleId: number;

  @IsDate()
  eventDate: string;

  @ApiProperty({ enum: EventStatus, description: 'Status of the event' })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Array of participant staff IDs',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  participantIds?: number[];
}
