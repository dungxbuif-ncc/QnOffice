import { Injectable } from "@nestjs/common";
import { Command, AutoContext, SmartMessage } from "@src/libs/nezon";
import type { Nezon } from "@src/libs/nezon";

@Injectable()
export class PingHandler {
  @Command({ name: "ping", aliases: ["pong"] })
  async onPing(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    await managedMessage.reply(SmartMessage.text("ping cuối đầu bài!"));
  }
}