import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppRequest } from '@src/common/types';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { BillingEntity } from './entities/billing.entity';

@Controller('billings')
@ApiTags('Billings')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('my-billings')
  async getMyBillings(
    @Req() req: any,
    @Query('month') month?: string,
  ): Promise<BillingEntity[]> {
    const user = req.user;
    return this.billingService.getMyBillings(user.mezonId, month);
  }

  @Patch(':id/orders/:orderId')
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
  async getUnbilledOrders(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.billingService.getUnbilledOrders(user.mezonId, parseInt(id));
  }

  @Post(':id/orders')
  async addOrdersToBilling(
    @Param('id') id: string,
    @Body() body: { orderIds: string[] },
    @Req() req: AppRequest,
  ) {
    const user = req.user;
    return this.billingService.addOrdersToBilling(
      user.mezonId,
      parseInt(id),
      body.orderIds,
    );
  }

  @Post(':id/send')
  async sendBill(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.billingService.sendBill(user.mezonId, parseInt(id));
  }
}
