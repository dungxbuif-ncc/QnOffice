import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class SwapOpentalkDto {
  @ApiProperty({ description: 'First event ID' })
  @IsNotEmpty()
  @IsNumber()
  event1Id: number;

  @ApiProperty({ description: 'Second event ID' })
  @IsNotEmpty()
  @IsNumber()
  event2Id: number;
}
