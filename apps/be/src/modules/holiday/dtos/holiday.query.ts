import { IHolidayQuery } from '@qnoffice/shared';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class HolidayQuery
  extends AppPaginateOptionsDto
  implements IHolidayQuery
{
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
