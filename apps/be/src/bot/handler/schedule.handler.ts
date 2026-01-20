import { Injectable, Logger } from '@nestjs/common';
import { Arg, AutoContext, Command, EmbedBuilder, Prefix, SmartMessage } from '@src/libs/nezon';
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

  @Command({ name: 'trucnhat' })
  async onCheckMySchedule(@AutoContext() [managedMessage]: Nezon.AutoContext, @Prefix() prefix: string, @Arg() name: Nezon.Args) {
    const userId = managedMessage.senderId;
    this.logger.log(`User ${userId} requested cleaning schedule`);

    const officeCode = prefix.replace('*', '').toUpperCase();

    try {
      const staff = name
        ? await this.staffService.findByName(name.toString())
        : await this.staffService.findByUserId(userId);

      if (!staff) {
        await managedMessage.reply(SmartMessage.system("Tài khoản của bạn không có trong hệ thống"));
        return;
      }

      if (staff.branch.code !== officeCode) {
        await managedMessage.reply(SmartMessage.system(`Bạn không không có lịch trực tại chi nhánh ${officeCode}`));
        return;
      }

      const today = startOfToday().toISOString();
      const eventCleans = await this.cleaningService.getEvents({ startDate: today, participantId: staff.id });
      if (!eventCleans.length) {
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
