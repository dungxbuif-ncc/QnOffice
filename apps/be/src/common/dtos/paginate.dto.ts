import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AppPaginationDto<T> {
  @IsNumber()
  page: number;

  @IsNumber()
  pageSize: number;

  @IsNumber()
  total: number;

  @ApiProperty({ isArray: true })
  readonly result: T[];
}
