import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppRequest } from '@src/common/types';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { GetOrdersGroupedDto } from './dto/get-orders-grouped.dto';
import { OrderService } from './order.service';

@Controller('orders')
@ApiTags('Orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async getGroupedOrders(@Query() query: GetOrdersGroupedDto) {
    return this.orderService.getOrdersGrouped(query);
  }

  @Get('my')
  async getMyOrders(
    @Req() req: AppRequest,
    @Query() query: GetOrdersGroupedDto,
  ) {
    return this.orderService.getMyOrders(req.user.mezonId, query);
  }
}
