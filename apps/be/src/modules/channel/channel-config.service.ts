import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MezonChannelType } from '@qnoffice/shared';
import { Repository } from 'typeorm';
import ChannelConfigEntity from './channel-config.entity';
import {
  ConfigureChannelDto,
  UpdateChannelConfigDto,
} from './dto/channel-config.dto';

@Injectable()
export class ChannelConfigService {
  private readonly logger = new Logger(ChannelConfigService.name);

  constructor(
    @InjectRepository(ChannelConfigEntity)
    private readonly channelConfigRepository: Repository<ChannelConfigEntity>,
  ) {}

  async configureChannel(
    dto: ConfigureChannelDto,
  ): Promise<ChannelConfigEntity> {
    this.logger.log(
      `Configuring channel ${dto.channelType} with ID ${dto.channelId}`,
    );

    const existing = await this.channelConfigRepository.findOne({
      where: { channelType: dto.channelType },
    });

    if (existing) {
      Object.assign(existing, {
        channelId: dto.channelId,
        channelName: dto.channelName,
        description: dto.description,
        isActive: dto.isActive ?? existing.isActive,
      });
      return this.channelConfigRepository.save(existing);
    }

    const config = this.channelConfigRepository.create({
      channelType: dto.channelType,
      channelId: dto.channelId,
      channelName: dto.channelName,
      description: dto.description,
      isActive: dto.isActive ?? true,
    });

    return this.channelConfigRepository.save(config);
  }

  async updateChannelConfig(
    channelType: MezonChannelType,
    dto: UpdateChannelConfigDto,
  ): Promise<ChannelConfigEntity> {
    const config = await this.channelConfigRepository.findOne({
      where: { channelType },
    });

    if (!config) {
      throw new NotFoundException(
        `Channel configuration for ${channelType} not found`,
      );
    }

    Object.assign(config, dto);
    return this.channelConfigRepository.save(config);
  }

  async getChannelConfig(
    channelType: MezonChannelType,
  ): Promise<ChannelConfigEntity | null> {
    return this.channelConfigRepository.findOne({
      where: { channelType },
    });
  }

  async getChannelId(channelType: MezonChannelType): Promise<string | null> {
    const config = await this.getChannelConfig(channelType);
    return config?.isActive ? config.channelId : null;
  }

  async getAllChannelConfigs(): Promise<ChannelConfigEntity[]> {
    return this.channelConfigRepository.find({
      order: { channelType: 'ASC' },
    });
  }

  async deleteChannelConfig(channelType: MezonChannelType): Promise<void> {
    const config = await this.channelConfigRepository.findOne({
      where: { channelType },
    });

    if (!config) {
      throw new NotFoundException(
        `Channel configuration for ${channelType} not found`,
      );
    }

    await this.channelConfigRepository.remove(config);
  }

  async getActiveChannels(): Promise<
    Record<MezonChannelType, string | undefined>
  > {
    const configs = await this.channelConfigRepository.find({
      where: { isActive: true },
    });

    const channelMap: Record<string, string | undefined> = {};
    configs.forEach((config) => {
      channelMap[config.channelType] = config.channelId;
    });

    return channelMap as Record<MezonChannelType, string | undefined>;
  }
}
