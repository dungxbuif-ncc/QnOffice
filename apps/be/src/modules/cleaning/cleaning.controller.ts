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
import { CleaningService } from '@src/modules/cleaning/cleaning.service';
import { CleaningQueryDto } from '@src/modules/cleaning/dtos/cleaning-query.dto';
import { CreateCleaningCycleDto } from '@src/modules/cleaning/dtos/create-cleaning-cycle.dto';
import { CreateCleaningEventDto } from '@src/modules/cleaning/dtos/create-cleaning-event.dto';
import ScheduleCycleEntity from '@src/modules/schedule/enties/schedule-cycle.entity';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';

@ApiTags('Cleaning Management')
@Controller('cleaning')
export class CleaningController {
  constructor(private readonly cleaningService: CleaningService) {}

  @Post('cycles')
  @ApiOperation({ summary: 'Create a new cleaning cycle' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cleaning cycle created successfully',
  })
  async createCycle(
    @Body() createCycleDto: CreateCleaningCycleDto,
  ): Promise<ScheduleCycleEntity> {
    return this.cleaningService.createCycle(createCycleDto);
  }

  @Get('cycles')
  @ApiOperation({
    summary: 'Get all cleaning cycles with events and participants',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by cycle status',
  })
  async getCycles(
    @Query('status') status?: string,
  ): Promise<ScheduleCycleEntity[]> {
    return this.cleaningService.getCyclesWithEvents(status);
  }

  @Get('cycles/:id')
  @ApiOperation({ summary: 'Get cleaning cycle by ID' })
  @ApiParam({ name: 'id', description: 'Cycle ID' })
  async getCycleById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ScheduleCycleEntity | null> {
    return this.cleaningService.getCycleById(id);
  }

  @Put('cycles/:id')
  @ApiOperation({ summary: 'Update cleaning cycle' })
  @ApiParam({ name: 'id', description: 'Cycle ID' })
  async updateCycle(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateCleaningCycleDto>,
  ): Promise<ScheduleCycleEntity> {
    return this.cleaningService.updateCycle(id, updateData);
  }

  @Delete('cycles/:id')
  @ApiOperation({ summary: 'Delete cleaning cycle' })
  @ApiParam({ name: 'id', description: 'Cycle ID' })
  async deleteCycle(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cleaningService.deleteCycle(id);
  }

  // Cleaning Event Management
  @Post('events')
  @ApiOperation({ summary: 'Create a new cleaning event' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cleaning event created successfully',
  })
  async createEvent(
    @Body() createEventDto: CreateCleaningEventDto,
  ): Promise<ScheduleEventEntity> {
    return this.cleaningService.createEvent(createEventDto);
  }

  @Get('events/swap-available')
  @ApiOperation({ summary: 'Get cleaning events with filters' })
  async getEvents(
    @Query() query: CleaningQueryDto,
  ): Promise<ScheduleEventEntity[]> {
    return this.cleaningService.getAvailableEvents(query);
  }

  @Get('cycles/:cycleId/events')
  @ApiOperation({ summary: 'Get cleaning events for a specific cycle' })
  @ApiParam({ name: 'cycleId', description: 'Cycle ID' })
  async getEventsByCycle(
    @Param('cycleId', ParseIntPipe) cycleId: number,
  ): Promise<ScheduleEventEntity[]> {
    return this.cleaningService.getEventsByCycle(cycleId);
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get cleaning event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async getEventById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ScheduleEventEntity | null> {
    return this.cleaningService.getEventById(id);
  }

  @Get('events/:id/cycle-events')
  @ApiOperation({
    summary: 'Get events from the same cycle as the specified event',
  })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async getCycleEvents(
    @Param('id', ParseIntPipe) eventId: number,
    @Query() query: { participantId: number },
  ): Promise<ScheduleEventEntity[]> {
    return this.cleaningService.getCycleEventsByEventId(eventId, query);
  }

  @Put('events/:id')
  @ApiOperation({ summary: 'Update cleaning event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateCleaningEventDto>,
  ): Promise<ScheduleEventEntity> {
    return this.cleaningService.updateEvent(id, updateData);
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Delete cleaning event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async deleteEvent(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cleaningService.deleteEvent(id);
  }

  // Cleaning Specific Operations
  @Get('spreadsheet')
  @ApiOperation({ summary: 'Get cleaning data in spreadsheet format' })
  @ApiQuery({
    name: 'cycleId',
    required: false,
    description: 'Filter by cycle ID',
  })
  async getSpreadsheetData(@Query('cycleId') cycleId?: number): Promise<any> {
    return this.cleaningService.getSpreadsheetData(cycleId);
  }

  @Post('bulk-assign')
  @ApiOperation({ summary: 'Bulk assign participants to cleaning events' })
  async bulkAssignParticipants(
    @Body()
    assignmentData: {
      cycleId: number;
      assignments: Array<{ eventId: number; participantIds: number[] }>;
    },
  ): Promise<ScheduleEventEntity[]> {
    return this.cleaningService.bulkAssignParticipants(assignmentData);
  }

  @Post('swap')
  @ApiOperation({ summary: 'Swap participants between two cleaning events' })
  async swapEvents(
    @Body()
    swapData: {
      participant1: { eventId: number; staffId: number };
      participant2: { eventId: number; staffId: number };
    },
  ): Promise<void> {
    return this.cleaningService.swapEventParticipants(
      swapData.participant1,
      swapData.participant2,
    );
  }
}
