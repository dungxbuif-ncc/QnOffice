import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MezonChannelType, UserRole } from '@qnoffice/shared';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import ChannelConfigEntity from './channel-config.entity';
import { ChannelConfigService } from './channel-config.service';
import {
  ConfigureChannelDto,
  UpdateChannelConfigDto,
} from './dto/channel-config.dto';

@Controller('channel-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChannelConfigController {
  constructor(private readonly channelConfigService: ChannelConfigService) {}

  @Post()
  @Roles([UserRole.HR, UserRole.GDVP])
  async configureChannel(
    @Body() dto: ConfigureChannelDto,
  ): Promise<ChannelConfigEntity> {
    return this.channelConfigService.configureChannel(dto);
  }

  @Get()
  @Roles([UserRole.HR, UserRole.GDVP])
  async getAllChannelConfigs(): Promise<ChannelConfigEntity[]> {
    return this.channelConfigService.getAllChannelConfigs();
  }

  @Get('active')
  async getActiveChannels(): Promise<
    Record<MezonChannelType, string | undefined>
  > {
    return this.channelConfigService.getActiveChannels();
  }

  @Get(':channelType')
  @Roles([UserRole.HR, UserRole.GDVP])
  async getChannelConfig(
    @Param('channelType') channelType: MezonChannelType,
  ): Promise<ChannelConfigEntity | null> {
    return this.channelConfigService.getChannelConfig(channelType);
  }

  @Patch(':channelType')
  @Roles([UserRole.HR, UserRole.GDVP])
  async updateChannelConfig(
    @Param('channelType') channelType: MezonChannelType,
    @Body() dto: UpdateChannelConfigDto,
  ): Promise<ChannelConfigEntity> {
    return this.channelConfigService.updateChannelConfig(channelType, dto);
  }

  @Delete(':channelType')
  @Roles([UserRole.HR, UserRole.GDVP])
  async deleteChannelConfig(
    @Param('channelType') channelType: MezonChannelType,
  ): Promise<{ message: string }> {
    await this.channelConfigService.deleteChannelConfig(channelType);
    return { message: `Channel configuration for ${channelType} deleted` };
  }
}
