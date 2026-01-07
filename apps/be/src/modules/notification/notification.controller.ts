import {
  Body,
  Controller,
  Get,
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
import { CreateNotificationEventDto } from './dtos/create-notification-event.dto';
import { CreateSubscriptionDto } from './dtos/create-subscription.dto';
import { GetEventsQueryDto, GetNotificationsQueryDto } from './dtos/query.dto';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { NotificationService } from './services/notification.service';

// You would replace this with your actual auth guard
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {}

  @Post('events')
  @ApiOperation({ summary: 'Create a notification event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  async createEvent(@Body() createEventDto: CreateNotificationEventDto) {
    const eventId = await this.notificationService.emitEvent(createEventDto);
    return { success: true, eventId };
  }

  @Get('events')
  @ApiOperation({ summary: 'Get notification events' })
  @ApiQuery({
    name: 'eventType',
    required: false,
    description: 'Filter by event type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getEvents(@Query() _query: GetEventsQueryDto) {
    // This would be implemented in the service
    return { message: 'Not implemented yet' };
  }

  @Get('events/failed')
  @ApiOperation({ summary: 'Get failed events for monitoring' })
  async getFailedEvents() {
    const failedEvents = await this.notificationService.getFailedEvents();
    return { failedEvents };
  }

  @Post('events/:id/retry')
  @ApiOperation({ summary: 'Retry a failed event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async retryEvent(@Param('id', ParseIntPipe) id: number) {
    await this.notificationService.retryFailedEvent(id);
    return { success: true, message: 'Event queued for retry' };
  }

  @Get()
  @ApiOperation({ summary: 'Get notifications for user/staff' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'staffId',
    required: false,
    description: 'Filter by staff ID',
  })
  @ApiQuery({
    name: 'read',
    required: false,
    description: 'Filter by read status',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getNotifications(@Query() query: GetNotificationsQueryDto) {
    const notifications = await this.notificationService.getNotifications(
      query.userId,
      query.staffId,
      {
        read: query.read,
        page: query.page,
        limit: query.limit,
      },
    );
    return { notifications };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    await this.notificationService.markAsRead(id);
    return { success: true, message: 'Notification marked as read' };
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create a notification subscription' })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    const subscription = await this.notificationService.createSubscription(
      createSubscriptionDto,
    );
    return { success: true, subscription };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get notification system health status' })
  async getHealth() {
    const circuitStats = this.circuitBreakerService.getAllStats();
    const failedEvents = await this.notificationService.getFailedEvents();

    const openCircuits = Object.entries(circuitStats).filter(
      ([, stat]) => stat.state === 'OPEN',
    ).length;

    return {
      status: openCircuits === 0 ? 'healthy' : 'degraded',
      circuits: circuitStats,
      failedEvents: failedEvents.length,
      details: {
        openCircuits,
        deadLetterEvents: failedEvents.filter((e) => e.status === 'DEAD_LETTER')
          .length,
        retryableEvents: failedEvents.filter((e) => e.status === 'FAILED')
          .length,
      },
    };
  }

  @Post('circuits/:name/reset')
  @ApiOperation({ summary: 'Reset a circuit breaker' })
  @ApiParam({ name: 'name', description: 'Circuit breaker name' })
  async resetCircuit(@Param('name') name: string) {
    this.circuitBreakerService.reset(name);
    return { success: true, message: `Circuit breaker '${name}' reset` };
  }

  @Post('circuits/:name/force-open')
  @ApiOperation({ summary: 'Force open a circuit breaker' })
  @ApiParam({ name: 'name', description: 'Circuit breaker name' })
  @ApiQuery({
    name: 'duration',
    required: false,
    description: 'Duration in minutes',
  })
  async forceOpenCircuit(
    @Param('name') name: string,
    @Query('duration') duration?: number,
  ) {
    const durationMs = duration ? duration * 60 * 1000 : undefined;
    this.circuitBreakerService.forceOpen(name, durationMs);
    return {
      success: true,
      message: `Circuit breaker '${name}' forced open${duration ? ` for ${duration} minutes` : ''}`,
    };
  }
}
