import { MezonChannelType } from '../constants';

export interface ChannelConfig {
  channelType: MezonChannelType;
  channelId: string;
  channelName: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IConfigureChannelDto {
  channelType: MezonChannelType;
  channelId: string;
  channelName?: string;
  description?: string;
  isActive?: boolean;
}

export interface IUpdateChannelConfigDto {
  channelId?: string;
  channelName?: string;
  description?: string;
  isActive?: boolean;
}
