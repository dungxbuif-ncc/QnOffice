import Order from '@src/common/constants/order.enum';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class AppPaginateOptionsDto {
  @IsOptional()
  @IsEnum(Order)
  readonly order: Order = Order.DESC;

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
