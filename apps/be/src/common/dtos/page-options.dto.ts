import { IPaginateOptionsDto, QueryOrder } from '@qnoffice/shared';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
export class AppPaginateOptionsDto implements IPaginateOptionsDto {
  @IsOptional()
  @IsEnum(QueryOrder)
  readonly order: QueryOrder = QueryOrder.DESC;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  readonly page: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  readonly take: number = 10;

  @IsOptional()
  @IsString()
  readonly q?: string;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
