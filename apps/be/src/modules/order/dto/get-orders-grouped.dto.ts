import { OrderGroupQuery } from '@qnoffice/shared';
import { IsDateString, IsOptional } from 'class-validator';

export class GetOrdersGroupedDto implements OrderGroupQuery {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
