import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ScheduleCycle, ScheduleEvent } from '@qnoffice/shared';
import { CreateCycleDto } from './dtos/create-cycle.dto';
import { CreateEventDto } from './dtos/create-event.dto';
import { ScheduleQueryDto } from './dtos/schedule-query.dto';
import { ScheduleService } from './schedule.service';

@ApiTags('Schedule Management')
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // Cycle endpoints
  @Post('cycles')
  @ApiOperation({ summary: 'Create a new schedule cycle' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cycle created successfully',
  })
  async createCycle(
    @Body() createCycleDto: CreateCycleDto,
  ): Promise<ScheduleCycle> {
    return this.scheduleService.createCycle(createCycleDto) as any;
  }

  @Get('cycles')
  @ApiOperation({ summary: 'Get all cycles' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by cycle type',
  })
  async getCycles(@Query('type') type?: string): Promise<ScheduleCycle[]> {
    return this.scheduleService.getCycles(type) as any;
  }

  @Get('cycles/:id')
  @ApiOperation({ summary: 'Get cycle by ID' })
  @ApiParam({ name: 'id', description: 'Cycle ID' })
  async getCycleById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ScheduleCycle | null> {
    return this.scheduleService.getCycleById(id) as any;
  }

  // Event endpoints
  @Post('events')
  @ApiOperation({ summary: 'Create a new schedule event' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Event created successfully',
  })
  async createEvent(
    @Body() createEventDto: CreateEventDto,
  ): Promise<ScheduleEvent> {
    return this.scheduleService.createEvent(createEventDto) as any;
  }

  @Get('events')
  @ApiOperation({ summary: 'Get events with filters' })
  async getEvents(
    @Query() query: ScheduleQueryDto,
  ): Promise<ScheduleEvent<any>[]> {
    return this.scheduleService.getEvents(query) as any;
  }

  @Get('cycles/:cycleId/events')
  @ApiOperation({ summary: 'Get events for a specific cycle' })
  @ApiParam({ name: 'cycleId', description: 'Cycle ID' })
  async getEventsByCycle(
    @Param('cycleId', ParseIntPipe) cycleId: number,
  ): Promise<ScheduleEvent<any>[]> {
    return this.scheduleService.getEventsByCycle(cycleId) as any;
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async getEventById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ScheduleEvent<any> | null> {
    return this.scheduleService.getEventById(id) as any;
  }

  @Put('events/:id')
  @ApiOperation({ summary: 'Update event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateEventDto>,
  ): Promise<ScheduleEvent> {
    return this.scheduleService.updateEvent(id, updateData) as any;
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Delete event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async deleteEvent(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.scheduleService.deleteEvent(id);
  }

  @Post('events/:event1Id/swap/:event2Id')
  @ApiOperation({ summary: 'Swap participants between two events' })
  @ApiParam({ name: 'event1Id', description: 'First event ID' })
  @ApiParam({ name: 'event2Id', description: 'Second event ID' })
  async swapEventParticipants(
    @Param('event1Id', ParseIntPipe) event1Id: number,
    @Param('event2Id', ParseIntPipe) event2Id: number,
  ): Promise<void> {
    return this.scheduleService.swapEventParticipants(event1Id, event2Id);
  }
}
