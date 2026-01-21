import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('orders')
@ApiTags('Orders')
export class OrderController {}
