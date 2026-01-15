import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ScheduleCycle, ScheduleEvent, UserRole } from '@qnoffice/shared';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { SubmitSlideDto } from '@src/modules/opentalk/dtos/submit-slide.dto';
import ScheduleEventEntity from '../schedule/enties/schedule-event.entity';
import { CreateOpentalkEventDto } from './dtos/create-opentalk-event.dto';
import { OpentalkQueryDto } from './dtos/opentalk-query.dto';
import { RejectSlideDto } from './dtos/reject-slide.dto';
import { SwapOpentalkDto } from './dtos/swap-opentalk.dto';
import { OpentalkService } from './opentalk.service';

@ApiTags('Opentalk Management')
@Controller('opentalk')
@UseGuards(JwtAuthGuard)
export class OpentalkController {
  constructor(private readonly opentalkService: OpentalkService) {}

  @Get('cycles')
  async getCycles(@Query('status') status?: string): Promise<ScheduleCycle[]> {
    return this.opentalkService.getCycles(status) as any;
  }

  @Post('slides/submit')
  async submitSlide(@Body() dto: SubmitSlideDto): Promise<void> {
    this.opentalkService.submitSlide(dto);
  }
  @Get('events/swap-available')
  async getEvents(@Query() query: OpentalkQueryDto): Promise<ScheduleEvent[]> {
    return this.opentalkService.getAvailableEvents(query) as any;
  }

  @Get('events/:id/cycle-events')
  async getCycleEvents(
    @Param('id', ParseIntPipe) eventId: number,
    @Query() query: { participantId: number },
  ): Promise<ScheduleEvent[]> {
    return this.opentalkService.getCycleEventsByEventId(eventId, query) as any;
  }

  @Get('events/:id/slide')
  async getSlide(@Param('id', ParseIntPipe) eventId: number) {
    return this.opentalkService.getSlideByEventId(eventId);
  }

  @Put('events/:id/approve-slide')
  @UseGuards(RolesGuard)
  @Roles([UserRole.GDVP])
  async approveSlide(
    @Param('id', ParseIntPipe) eventId: number,
    @Req() req: any,
  ): Promise<void> {
    const userId = req.user?.id;
    return this.opentalkService.approveSlide(eventId, userId);
  }

  @Put('events/:id/reject-slide')
  @UseGuards(RolesGuard)
  @Roles([UserRole.GDVP])
  async rejectSlide(
    @Param('id', ParseIntPipe) eventId: number,
    @Body() dto: RejectSlideDto,
    @Req() req: any,
  ): Promise<void> {
    const userId = req.user?.id;
    return this.opentalkService.rejectSlide(eventId, userId, dto.reason);
  }

  @Post('swap')
  @UseGuards(RolesGuard)
  @Roles([UserRole.GDVP, UserRole.HR])
  async swapOpentalk(@Body() swapDto: SwapOpentalkDto): Promise<void> {
    return this.opentalkService.swapOpentalk(swapDto);
  }

  @Put('events/:id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.GDVP, UserRole.HR])
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateOpentalkEventDto>,
  ): Promise<ScheduleEventEntity> {
    return this.opentalkService.updateEvent(id, updateData);
  }
}
