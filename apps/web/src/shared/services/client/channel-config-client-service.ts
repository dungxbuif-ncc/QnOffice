import baseApi from '@/shared/services/client/base-api';
import { ApiResponse, MezonChannelType } from '@qnoffice/shared';

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

class ChannelConfigClientService {
  private readonly baseUrl = '/channel-config';

  async getAllConfigs() {
    const response = await baseApi.get<ApiResponse<ChannelConfig[]>>(
      this.baseUrl,
    );
    return response.data || [];
  }

  async getActiveChannels() {
    const response = await baseApi.get<
      Record<MezonChannelType, string | undefined>
    >(`${this.baseUrl}/active`);
    return response.data;
  }

  async getConfig(channelType: MezonChannelType) {
    const response = await baseApi.get<ChannelConfig | null>(
      `${this.baseUrl}/${channelType}`,
    );
    return response.data;
  }

  async configureChannel(data: ConfigureChannelDto) {
    const response = await baseApi.post<ChannelConfig>(this.baseUrl, data);
    return response.data;
  }

  async updateConfig(
    channelType: MezonChannelType,
    data: UpdateChannelConfigDto,
  ) {
    const response = await baseApi.patch<ChannelConfig>(
      `${this.baseUrl}/${channelType}`,
      data,
    );
    return response.data;
  }

  async deleteConfig(channelType: MezonChannelType) {
    const response = await baseApi.delete<{ message: string }>(
      `${this.baseUrl}/${channelType}`,
    );
    return response.data;
  }
}

export const channelConfigClientService = new ChannelConfigClientService();
export { ChannelConfigClientService };
