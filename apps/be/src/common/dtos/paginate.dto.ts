import { ApiProperty } from '@nestjs/swagger';
import { IPaginationDto } from '@qnoffice/shared';
import { IsNumber } from 'class-validator';

export class AppPaginationDto<T> implements IPaginationDto<T> {
  @IsNumber()
  page: number;

  @IsNumber()
  pageSize: number;

  @IsNumber()
  total: number;

  @ApiProperty({ isArray: true })
  readonly result: T[];
}
