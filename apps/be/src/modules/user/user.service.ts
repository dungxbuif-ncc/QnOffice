import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  NotificationEvent,
  UserMessagePayload,
} from '@src/common/events/notification.events';
import { isEmpty } from 'lodash';
import { In, Repository } from 'typeorm';
import UserEntity from './user.entity';

type UpsertUserMeta = {
  name?: string;
  email?: string;
  avatar?: string;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly userCache = new Map<string, UserMessagePayload>();

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {
    this.loadUsersIntoCache();
  }

  private async loadUsersIntoCache() {
    this.logger.log('Loading users into memory cache...');
    const users = await this.userRepository.find();
    users.forEach((user) => {
      this.userCache.set(user.mezonId, {
        name: user.name,
        avatar: user.avatar,
        mezonId: user.mezonId,
      });
    });
    this.logger.log(`Loaded ${users.length} users into cache`);
  }

  @OnEvent(NotificationEvent.USER_MESSAGE)
  async handleUserMessage(payload: UserMessagePayload) {
    const { mezonId, name, avatar } = payload;

    const cachedUser = this.userCache.get(mezonId);

    const needsUpdate =
      !cachedUser ||
      (name && cachedUser.name !== name) ||
      (avatar && cachedUser.avatar !== avatar);

    if (needsUpdate) {
      this.logger.log(`Upserting user ${mezonId} from message event`);
      await this.upsertByMezonId(mezonId, {
        name,
        avatar,
      });
    }
  }

  private async create(user: Partial<UserEntity>) {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async getUserByClanData(payload: {
    id?: string;
    username?: string;
    clan?: { clan_id: string; clan_nick: string };
  }) {
    const { id, username, clan } = payload;
    if (!id && !username && isEmpty(clan)) {
      this.logger.warn(
        'getUserByClanData called without id, username or clan data',
      );
      return null;
    }
    const query = {};
    if (id) {
      Object.assign(query, { id });
    }
    if (username) {
      Object.assign(query, { username });
    }
    if (clan) {
      Object.assign(query, {
        clanMetaData: `clanMetaData @> '[{"clan_id": "${clan.clan_id}"}]'`,
      });
    }
    return this.userRepository.findOneBy(query);
  }

  async getManyByIdsAndUsernames({
    ids,
    mezonIds,
  }: {
    ids?: string[];
    mezonIds?: string[];
  }) {
    const orConditions: Array<import('typeorm').FindOptionsWhere<UserEntity>> =
      [];
    if (ids?.length) {
      orConditions.push({ mezonId: In(ids.map((id) => parseInt(id))) });
    }
    if (mezonIds?.length) {
      orConditions.push({ mezonId: In(mezonIds) });
    }
    if (orConditions.length === 0) {
      return [];
    }
    return this.userRepository.find({ where: orConditions });
  }

  async findById(mezonId: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { mezonId } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByMezonId(mezonId: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { mezonId },
    });
  }

  async upsertByMezonId(
    mezonId: string,
    meta?: UpsertUserMeta,
  ): Promise<UserEntity> {
    const existingUser = await this.findByMezonId(mezonId);
    if (existingUser) {
      this.userCache.set(mezonId, {
        name: existingUser?.name,
        avatar: existingUser?.avatar,
        mezonId,
      });
      return this.userRepository.save(existingUser);
    }
    this.userCache.set(mezonId, {
      name: meta?.name,
      avatar: meta?.avatar,
      mezonId,
    });
    return this.create({ ...meta, mezonId });
  }
}
