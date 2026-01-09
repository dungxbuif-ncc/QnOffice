import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ScheduleCycle } from '@qnoffice/shared';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { SubmitSlideDto } from '@src/modules/opentalk/dtos/submit-slide.dto';
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

  // @Get('cycles/:id')
  // @ApiOperation({ summary: 'Get opentalk cycle by ID' })
  // @ApiParam({ name: 'id', description: 'Cycle ID' })
  // async getCycleById(
  //   @Param('id', ParseIntPipe) id: number,
  // ): Promise<ScheduleCycle | null> {
  //   return this.opentalkService.getCycleById(id) as any;
  // }

  // @Put('cycles/:id')
  // @ApiOperation({ summary: 'Update opentalk cycle' })
  // @ApiParam({ name: 'id', description: 'Cycle ID' })
  // async updateCycle(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() updateData: Partial<CreateOpentalkCycleDto>,
  // ): Promise<ScheduleCycle> {
  //   return this.opentalkService.updateCycle(id, updateData) as any;
  // }

  // @Delete('cycles/:id')
  // @ApiOperation({ summary: 'Delete opentalk cycle' })
  // @ApiParam({ name: 'id', description: 'Cycle ID' })
  // async deleteCycle(@Param('id', ParseIntPipe) id: number): Promise<void> {
  //   return this.opentalkService.deleteCycle(id);
  // }

  // @Get('events')
  // @ApiOperation({ summary: 'Get opentalk events with filters' })
  // async getEvents(@Query() query: OpentalkQueryDto): Promise<ScheduleEvent[]> {
  //   return this.opentalkService.getEvents(query) as any;
  // }

  // @Get('events/:id')
  // @ApiOperation({ summary: 'Get opentalk event by ID' })
  // @ApiParam({ name: 'id', description: 'Event ID' })
  // async getEventById(
  //   @Param('id', ParseIntPipe) id: number,
  // ): Promise<ScheduleEvent | null> {
  //   return this.opentalkService.getEventById(id) as any;
  // }

  // @Put('events/:id')
  // @ApiOperation({ summary: 'Update opentalk event' })
  // @ApiParam({ name: 'id', description: 'Event ID' })
  // async updateEvent(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() updateData: Partial<CreateOpentalkEventDto>,
  // ): Promise<ScheduleEvent> {
  //   return this.opentalkService.updateEvent(id, updateData) as any;
  // }

  // @Delete('events/:id')
  // @ApiOperation({ summary: 'Delete opentalk event' })
  // @ApiParam({ name: 'id', description: 'Event ID' })
  // async deleteEvent(@Param('id', ParseIntPipe) id: number): Promise<void> {
  //   return this.opentalkService.deleteEvent(id);
  // }

  // @Post('swap')
  // async swapOpentalk(@Body() swapDto: SwapOpentalkDto): Promise<void> {
  //   return this.opentalkService.swapOpentalk(swapDto);
  // }

  // @Get('slides/:eventId')
  // @ApiOperation({ summary: 'Get slide submission for an event' })
  // @ApiParam({ name: 'eventId', description: 'Event ID' })
  // async getSlideSubmission(
  //   @Param('eventId', ParseIntPipe) eventId: number,
  // ): Promise<OpentalkSlideSubmission | null> {
  //   return this.slideService.getSlideSubmission(eventId) as any;
  // }
}
