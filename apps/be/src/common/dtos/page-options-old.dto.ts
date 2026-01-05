import Order from '@src/common/constants/order.enum';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
export class AppPaginateOptionsDto {
  @IsOptional()
  @IsEnum(Order)
  readonly order: Order = Order.DESC;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  readonly page: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  readonly take: number = 10;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
  readonly q?: string;
}
