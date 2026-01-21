import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { GetOrdersGroupedDto } from './dto/get-orders-grouped.dto';
import { OrderService } from './order.service';

@Controller('orders')
@ApiTags('Orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getGroupedOrders(@Query() query: GetOrdersGroupedDto) {
    return this.orderService.getOrdersGrouped(query);
  }
}
