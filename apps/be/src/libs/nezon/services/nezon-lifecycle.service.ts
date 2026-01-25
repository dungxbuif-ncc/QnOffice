import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { NezonClientService } from '../client/nezon-client.service';
import { NezonCommandService } from './nezon-command.service';
import { NezonComponentService } from './nezon-component.service';
import { NezonEventsService } from './nezon-events.service';

@Injectable()
export class NezonLifecycleService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(NezonLifecycleService.name);

  constructor(
    private readonly clientService: NezonClientService,
    private readonly commandService: NezonCommandService,
    private readonly eventsService: NezonEventsService,
    private readonly componentService: NezonComponentService,
  ) {}

  onApplicationBootstrap() {
    this.initializeBotBackground();
  }

  private async initializeBotBackground() {
    this.logger.log('Initializing Bot in background...');
    try {
      await this.clientService.login();
      this.eventsService.initialize();
      await this.commandService.initialize();
    this.componentService.initialize();
      this.logger.log('Bot connected and initialized successfully.');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Nezon Bot. Proceeding without Bot functionalities.',
        error,
      );
    }
  }

  async onApplicationShutdown() {
    this.componentService.dispose();
    this.eventsService.dispose();
    await this.clientService.disconnect();
  }
}
