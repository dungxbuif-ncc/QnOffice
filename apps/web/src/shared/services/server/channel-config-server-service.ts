import { MezonChannelType } from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

export interface ChannelConfig {
  channelType: MezonChannelType;
  channelId: string;
  channelName: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigureChannelDto {
  channelType: MezonChannelType;
  channelId: string;
  channelName?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateChannelConfigDto {
  channelId?: string;
  channelName?: string;
  description?: string;
  isActive?: boolean;
}

export class ChannelConfigServerService extends BaseServerService {
  private readonly baseUrl = '/channel-config';

  async getAllConfigs() {
    const response = await this.get<ChannelConfig[]>(this.baseUrl);
    return response || [];
  }

  async getActiveChannels() {
    return this.get<Record<MezonChannelType, string | undefined>>(
      `${this.baseUrl}/active`,
    );
  }

  async getConfig(channelType: MezonChannelType) {
    return this.get<ChannelConfig | null>(`${this.baseUrl}/${channelType}`);
  }

  async configureChannel(data: ConfigureChannelDto) {
    return this.post<ChannelConfig>(this.baseUrl, data);
  }

  async updateConfig(
    channelType: MezonChannelType,
    data: UpdateChannelConfigDto,
  ) {
    return this.patch<ChannelConfig>(`${this.baseUrl}/${channelType}`, data);
  }

  async deleteConfig(channelType: MezonChannelType) {
    return this.delete<{ message: string }>(`${this.baseUrl}/${channelType}`);
  }
}
