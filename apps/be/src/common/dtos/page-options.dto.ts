import { IPaginateOptionsDto, SearchOrder } from '@qnoffice/shared';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
export class AppPaginateOptionsDto implements IPaginateOptionsDto {
  @IsOptional()
  @IsEnum(SearchOrder)
  readonly order: SearchOrder = SearchOrder.DESC;

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
