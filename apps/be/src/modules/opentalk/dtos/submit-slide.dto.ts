import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export default class SubmitSlideDto {
  @ApiProperty({
    example: 1,
    description: 'OpenTalk event ID',
  })
  @IsNumber()
  @IsNotEmpty()
  eventId: number;

  @ApiProperty({
    example: 'https://example.com/slides.pdf',
    description: 'Slide URL',
  })
  @IsUrl()
  @IsNotEmpty()
  slidesUrl: string;

  @ApiProperty({
    example: 'Introduction to NestJS',
    description: 'OpenTalk topic',
  })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiProperty({
    example: 'Additional notes',
    description: 'Optional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
