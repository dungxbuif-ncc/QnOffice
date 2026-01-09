/* eslint-disable no-useless-catch */
/* eslint-disable sonarjs/no-useless-catch */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Inject, Injectable } from '@nestjs/common';

import {
  ApiMessageAttachment,
  ApiMessageMention,
  ApiMessageRef,
  ChannelMessage,
  ChannelMessageContent,
  MezonClient,
} from 'mezon-sdk';

export function fieldGenerate(
  field: string,
  replayConent,
  message: ChannelMessage,
  defaultValue: Record<string, any>,
) {
  return field in replayConent
    ? replayConent[field]
    : field in defaultValue
      ? defaultValue[field]
      : message[field];
}

export interface ReplyMezonMessage {
  clan_id?: string;
  channel_id: string;
  channelDmId?: string;
  is_public?: boolean;
  is_parent_public?: boolean;
  parent_id?: string;
  mode?: number;
  msg: ChannelMessageContent;
  mentions?: ApiMessageMention[];
  attachments?: ApiMessageAttachment[];
  ref?: ApiMessageRef[]; // user for send message in channel
  userId: string;
  textContent?: string;
  messOptions?: Record<string, any>;
  refs?: ApiMessageRef[]; // user for send message to user
  sender_id?: string;
  anonymous_message?: boolean;
  mention_everyone?: boolean;
  avatar?: string;
  code?: number;
  topic_id?: string;
  message_id?: string;
}

export interface ReactMessageChannel {
  id?: string;
  clan_id: string;
  parent_id?: string;
  channel_id: string;
  mode: number;
  is_public: boolean;
  is_parent_public: boolean;
  message_id: string;
  emoji_id: string;
  emoji: string;
  count: number;
  message_sender_id: string;
  action_delete?: boolean;
}

export function refGenerate(msg: ChannelMessage): ApiMessageRef[] {
  return [
    {
      message_id: '',
      message_ref_id: msg.message_id as string,
      ref_type: 0,
      message_sender_id: msg.sender_id,
      message_sender_username: msg.username,
      mesages_sender_avatar: msg.avatar,
      message_sender_clan_nick: msg.clan_nick,
      message_sender_display_name: msg.display_name,
      content: JSON.stringify(msg.content),
      has_attachment: Boolean(msg?.attachments?.length) || false,
    },
  ];
}

export function replyMessageGenerate(
  replayConent: Record<string, any>,
  message: ChannelMessage,
  hasRef = true,
  newRef?: ApiMessageRef[],
): ReplyMezonMessage {
  const replayMessage: ReplyMezonMessage = {} as ReplyMezonMessage;
  const defaultValue = {
    mentions: [],
    attachments: [],
  };
  [
    'clan_id',
    'channel_id',
    'mode',
    'is_public',
    'topic_id',
    'message_id',
    ...Object.keys(defaultValue),
  ].forEach(
    (field) =>
      (replayMessage[field] = fieldGenerate(
        field,
        replayConent,
        message,
        defaultValue,
      )),
  );

  const messageContent = {
    t: 'messageContent' in replayConent ? replayConent.messageContent : '',
  };

  // option for bot's message
  [
    'lk',
    'hg',
    'mk',
    'ej',
    'vk',
    'contentThread',
    'embed',
    'components',
  ].forEach((key) => {
    if (key in replayConent) {
      messageContent[key] = replayConent[key];
    }
  });

  replayMessage.msg = { ...messageContent };

  replayMessage.ref = hasRef
    ? newRef?.length
      ? newRef
      : refGenerate(message)
    : [];

  return replayMessage;
}

@Injectable()
export class MezonClientService {
  constructor(@Inject('MEZON_CLIENT') private client: MezonClient) {}

  getClient() {
    return this.client;
  }

  async sendReplyMessage(
    channelMessageContent: Record<string, any>,
    message: ChannelMessage,
  ) {
    const messageToSend = replyMessageGenerate(channelMessageContent, message);
    await this.sendMessage(messageToSend);
  }
  async sendMessage(replyMessage: ReplyMezonMessage) {
    try {
      const channel = await this.client.channels.fetch(replyMessage.channel_id);
      if (replyMessage?.ref?.length && replyMessage?.message_id) {
        const message = await channel.messages.fetch(replyMessage.message_id);
        return await message.reply(
          replyMessage.msg,
          replyMessage.mentions,
          replyMessage.attachments,
          replyMessage.mention_everyone,
          replyMessage.anonymous_message,
          replyMessage.topic_id,
          replyMessage.code,
        );
      }
      return await channel.send(
        replyMessage.msg,
        replyMessage.mentions,
        replyMessage.attachments,
        replyMessage.mention_everyone,
        replyMessage.anonymous_message,
        replyMessage.topic_id,
        replyMessage.code,
      );
    } catch (error) {
      throw error;
    }
  }

  async sendMessageToChannel(
    channelId: string,
    message,
    mentions: ApiMessageMention[],
  ) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      return await channel.send(message, mentions);
    } catch (error) {
      throw error;
    }
  }
}
