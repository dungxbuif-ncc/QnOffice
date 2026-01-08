import { MezonChannelType } from '@qnoffice/shared';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfigureChannelDto {
  @IsString()
  @IsNotEmpty()
  channelType: MezonChannelType;

  @IsString()
  @IsNotEmpty()
  channelId: string;

  @IsString()
  @IsOptional()
  channelName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateChannelConfigDto {
  @IsString()
  @IsOptional()
  channelId?: string;

  @IsString()
  @IsOptional()
  channelName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
