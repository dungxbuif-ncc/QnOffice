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
import { CreateOpentalkCycleDto } from '@src/modules/opentalk/dtos/create-opentalk-cycle.dto';
import { CreateOpentalkEventDto } from '@src/modules/opentalk/dtos/create-opentalk-event.dto';
import CreateSwapRequestDto from '@src/modules/opentalk/dtos/create-swap-request.dto';
import { OpentalkQueryDto } from '@src/modules/opentalk/dtos/opentalk-query.dto';
import ReviewSwapRequestDto from '@src/modules/opentalk/dtos/review-swap-request.dto';
import { SwapOpentalkDto } from '@src/modules/opentalk/dtos/swap-opentalk.dto';
import ScheduleCycleEntity from '@src/modules/schedule/enties/schedule-cycle.entity';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';
import { OpentalkService } from './opentalk.service';
import SwapRequestEntity from './swap-request.entity';

@ApiTags('Opentalk Management')
@Controller('opentalk')
export class OpentalkController {
  constructor(private readonly opentalkService: OpentalkService) {}

  @Post('cycles')
  @ApiOperation({ summary: 'Create a new opentalk cycle' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Opentalk cycle created successfully',
  })
  async createCycle(
    @Body() createCycleDto: CreateOpentalkCycleDto,
  ): Promise<ScheduleCycleEntity> {
    return this.opentalkService.createCycle(createCycleDto);
  }

  @Get('cycles')
  @ApiOperation({
    summary: 'Get all opentalk cycles with events and participants',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by cycle status',
  })
  async getCycles(
    @Query('status') status?: string,
  ): Promise<ScheduleCycleEntity[]> {
    return this.opentalkService.getCyclesWithEvents(status);
  }

  @Get('cycles/:id')
  @ApiOperation({ summary: 'Get opentalk cycle by ID' })
  @ApiParam({ name: 'id', description: 'Cycle ID' })
  async getCycleById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ScheduleCycleEntity | null> {
    return this.opentalkService.getCycleById(id);
  }

  @Put('cycles/:id')
  @ApiOperation({ summary: 'Update opentalk cycle' })
  @ApiParam({ name: 'id', description: 'Cycle ID' })
  async updateCycle(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateOpentalkCycleDto>,
  ): Promise<ScheduleCycleEntity> {
    return this.opentalkService.updateCycle(id, updateData);
  }

  @Delete('cycles/:id')
  @ApiOperation({ summary: 'Delete opentalk cycle' })
  @ApiParam({ name: 'id', description: 'Cycle ID' })
  async deleteCycle(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.opentalkService.deleteCycle(id);
  }

  // Opentalk Event Management
  @Post('events')
  @ApiOperation({ summary: 'Create a new opentalk event' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Opentalk event created successfully',
  })
  async createEvent(
    @Body() createEventDto: CreateOpentalkEventDto,
  ): Promise<ScheduleEventEntity> {
    return this.opentalkService.createEvent(createEventDto);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get opentalk events with filters' })
  async getEvents(
    @Query() query: OpentalkQueryDto,
  ): Promise<ScheduleEventEntity[]> {
    return this.opentalkService.getEvents(query);
  }

  @Get('cycles/:cycleId/events')
  @ApiOperation({ summary: 'Get opentalk events for a specific cycle' })
  @ApiParam({ name: 'cycleId', description: 'Cycle ID' })
  async getEventsByCycle(
    @Param('cycleId', ParseIntPipe) cycleId: number,
  ): Promise<ScheduleEventEntity[]> {
    return this.opentalkService.getEventsByCycle(cycleId);
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get opentalk event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async getEventById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ScheduleEventEntity | null> {
    return this.opentalkService.getEventById(id);
  }

  @Put('events/:id')
  @ApiOperation({ summary: 'Update opentalk event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateOpentalkEventDto>,
  ): Promise<ScheduleEventEntity> {
    return this.opentalkService.updateEvent(id, updateData);
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Delete opentalk event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async deleteEvent(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.opentalkService.deleteEvent(id);
  }

  // Opentalk Specific Operations
  @Post('swap')
  @ApiOperation({ summary: 'Swap participants between opentalk events' })
  async swapParticipants(
    @Body() swapDto: SwapOpentalkDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.opentalkService.swapParticipants(swapDto);
  }

  @Get('spreadsheet')
  @ApiOperation({ summary: 'Get opentalk data in spreadsheet format' })
  @ApiQuery({
    name: 'cycleId',
    required: false,
    description: 'Filter by cycle ID',
  })
  async getSpreadsheetData(@Query('cycleId') cycleId?: number): Promise<any> {
    return this.opentalkService.getSpreadsheetData(cycleId);
  }

  @Post('bulk-assign')
  @ApiOperation({ summary: 'Bulk assign participants to opentalk events' })
  async bulkAssignParticipants(
    @Body()
    assignmentData: {
      cycleId: number;
      assignments: Array<{ eventId: number; participantIds: number[] }>;
    },
  ): Promise<ScheduleEventEntity[]> {
    return this.opentalkService.bulkAssignParticipants(assignmentData);
  }

  @Get('conflicts')
  @ApiOperation({
    summary: 'Check for participant conflicts in opentalk events',
  })
  @ApiQuery({ name: 'cycleId', required: false })
  async checkConflicts(@Query('cycleId') cycleId?: number): Promise<any[]> {
    return this.opentalkService.checkConflicts(cycleId);
  }

  // Swap Request Management
  @Get('swap-requests')
  @ApiOperation({ summary: 'Get swap requests' })
  @ApiQuery({ name: 'requesterId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getSwapRequests(
    @Query('requesterId') requesterId?: number,
    @Query('status') status?: string,
  ): Promise<SwapRequestEntity[]> {
    return this.opentalkService.getSwapRequests({
      requesterId,
      status,
    });
  }

  @Post('swap-requests')
  @ApiOperation({ summary: 'Create a new swap request' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Swap request created successfully',
  })
  async createSwapRequest(
    @Body() createSwapRequestDto: CreateSwapRequestDto,
    @Query('requesterId', ParseIntPipe) requesterId: number,
  ): Promise<SwapRequestEntity> {
    return this.opentalkService.createSwapRequest(
      createSwapRequestDto,
      requesterId,
    );
  }

  @Put('swap-requests/:id/review')
  @ApiOperation({ summary: 'Review a swap request (approve/reject)' })
  @ApiParam({ name: 'id', description: 'Swap request ID' })
  async reviewSwapRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewDto: ReviewSwapRequestDto,
  ): Promise<SwapRequestEntity> {
    return this.opentalkService.reviewSwapRequest(id, reviewDto);
  }

  @Get('user-schedules/:userId')
  @ApiOperation({ summary: 'Get user schedules for opentalk' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getUserSchedules(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ScheduleEventEntity[]> {
    return this.opentalkService.getUserSchedules(userId);
  }
}
