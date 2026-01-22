import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PantryTransactionWithUser } from '@qnoffice/shared';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import { GetStatsQueryDto } from './dto/get-stats-query.dto';
import { GetTransactionsQueryDto } from './dto/get-transactions-query.dto';
import { PantryTransactionService } from './pantry-transaction.service';

@Controller('pantry-transactions')
@ApiTags('Pantry Transactions')
export class PantryTransactionController {
  constructor(
    private readonly pantryTransactionService: PantryTransactionService,
  ) {}

  @Get()
  async getTransactions(
    @Query() query: GetTransactionsQueryDto,
  ): Promise<AppPaginationDto<PantryTransactionWithUser>> {
    return this.pantryTransactionService.getTransactions(
      query.page,
      query.limit,
      query.start_time,
      query.end_time,
    );
  }

  @Get('stats')
  async getStats(@Query() query: GetStatsQueryDto): Promise<{
    totalTransactions: number;
    totalAmount: number;
    uniqueContributors: number;
  }> {
    return this.pantryTransactionService.getTransactionStats(
      query.start_time,
      query.end_time,
    );
  }
}
