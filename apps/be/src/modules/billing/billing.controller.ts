import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { BillingEntity } from './entities/billing.entity';

@Controller('billings')
@ApiTags('Billings')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('my-billings')
  @UseGuards(JwtAuthGuard)
  async getMyBillings(
    @Req() req: any,
    @Query('month') month?: string,
  ): Promise<BillingEntity[]> {
    const user = req.user;
    return this.billingService.getMyBillings(user.mezonId, month);
  }

  @Patch(':id/orders/:orderId')
  @UseGuards(JwtAuthGuard)
  async updateOrder(
    @Param('id') id: string,
    @Param('orderId') orderId: string,
    @Body() body: { isPaid?: boolean; amount?: number },
    @Req() req: any,
  ) {
    const user = req.user;
    return this.billingService.updateOrder(
      user.mezonId,
      parseInt(id),
      orderId,
      body,
    );
  }

  @Delete(':id/orders/:orderId')
  @UseGuards(JwtAuthGuard)
  async removeOrderFromBilling(
    @Param('id') id: string,
    @Param('orderId') orderId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    return this.billingService.removeOrderFromBilling(
      user.mezonId,
      parseInt(id),
      orderId,
    );
  }

  @Get(':id/unbilled-orders')
  @UseGuards(JwtAuthGuard)
  async getUnbilledOrders(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const user = req.user;
    return this.billingService.getUnbilledOrders(user.mezonId, parseInt(id));
  }

  @Post(':id/orders')
  @UseGuards(JwtAuthGuard)
  async addOrdersToBilling(
    @Param('id') id: string,
    @Body() body: { orderIds: string[] },
    @Req() req: any,
  ) {
    const user = req.user;
    return this.billingService.addOrdersToBilling(
      user.mezonId,
      parseInt(id),
      body.orderIds,
    );
  }
}
