import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CalendarEvent, CalendarService } from './calendar.service';
import { CalendarQueryDto } from './dtos/calendar-query.dto';

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  @ApiOperation({
    summary: 'Get all calendar events (cleaning and opentalk)',
  })
  @ApiResponse({
    status: 200,
    description: 'Calendar events retrieved successfully',
  })
  async getCalendarEvents(
    @Query() query: CalendarQueryDto,
  ): Promise<CalendarEvent[]> {
    if (query.type) {
      return this.calendarService.getEventsByType(
        query.type,
        query.startDate,
        query.endDate,
      );
    }
    return this.calendarService.getCalendarEvents(
      query.startDate,
      query.endDate,
    );
  }
}
