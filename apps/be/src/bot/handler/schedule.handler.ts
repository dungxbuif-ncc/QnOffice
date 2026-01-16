import { Injectable, Logger } from '@nestjs/common';
import { Arg, AutoContext, Command, EmbedBuilder, SmartMessage } from '@src/libs/nezon';
import type { Nezon } from '@src/libs/nezon';
import { CleaningService } from '@src/modules/cleaning/cleaning.service';
import { StaffService } from '@src/modules/staff/staff.service';
import { startOfToday, format } from 'date-fns';
import { vi } from 'date-fns/locale';

@Injectable()
export class CleaningScheduleHandler {
  private readonly logger = new Logger(CleaningScheduleHandler.name);

  constructor(
    private readonly cleaningService: CleaningService,
    private readonly staffService: StaffService
  ) { }

  @Command({ name: 'lichtruc_cuatoi', aliases: ['MyCleaningSchedule', 'trucnhat_cuatao', 'trucnhat_cuatoi', 'trucnhat'] })
  async onCheckMySchedule(@AutoContext() [managedMessage]: Nezon.AutoContext, @Arg(0) name?: string | undefined) {
    const userId = managedMessage.senderId || "";
    this.logger.log(`User ${userId} requested cleaning schedule`);
    try {
      const staff = name
        ? await this.staffService.findByEmail(`${name}@ncc.asia`)
        : await this.staffService.findByUserId(userId);

      if (!staff) {
        await managedMessage.reply(SmartMessage.system("Bạn chưa được đăng kí trực nhật"));
        return;
      }
      const today = startOfToday().toISOString();
      const eventCleans = await this.cleaningService.getEvents({ startDate: today, participantId: staff.id });
      if (!eventCleans) {
        await managedMessage.reply(SmartMessage.system("Lịch trực nhật của bạn chưa được cập nhật"));
        return;
      }
      await managedMessage.reply(SmartMessage.system("")
        .addEmbed(
          new EmbedBuilder().setColor('#f0a8da')
            .setTitle(`🧑‍💼 Lịch trực nhật của bạn (thuộc Văn phòng ${staff.branch.name})`)
            .setThumbnail(staff.user.avatar || "https://cdn.mezon.ai/1779815181480628224/1999356326202839040.png")
            .setDescriptionMarkdown(
              eventCleans.map(
                e => `- ${staff.user.name} trực ${format(new Date(e.eventDate), 'EEEE', { locale: vi })} (${format(e.eventDate, 'dd/MM/yyyy')}) \n${e.title}`
              ).join("/n")
            )
            .setFooter(`Bộ phận Nhân sự - Văn phòng ${staff.branch.name} • ${format(new Date(), 'dd/MM/yyyy')}`)
        ));
    } catch (error) {
      this.logger.log(error);
    }
  }
}
