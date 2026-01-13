import { Injectable, Logger } from '@nestjs/common';
import { AutoContext, Command, EmbedBuilder, SmartMessage } from '@src/libs/nezon';
import type { Nezon } from '@src/libs/nezon';
import { CleaningService } from '@src/modules/cleaning/cleaning.service';
import { StaffService } from '@src/modules/staff/staff.service';
import { format, startOfToday } from 'date-fns';

@Injectable()
export class CleaningScheduleHandler {
  private readonly logger = new Logger(CleaningScheduleHandler.name);

  constructor(
    private readonly cleaningService: CleaningService,
    private readonly staffService: StaffService,
  ) {}

  @Command({ name: 'trucnhat_cuatao' })
  async onCheckSchedule(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    const userId = managedMessage.senderId
    this.logger.log(`User ${userId} requested cleaning schedule`);

    try {
      const staff = await this.staffService.findByUserId(userId);

      if (!staff) {
        await managedMessage.reply(
          SmartMessage.text(
            'Bạn chưa được liên kết với nhân viên trong hệ thống. Vui lòng liên hệ admin.',
          ),
        );
        return;
      }

      const events = await this.cleaningService.getEvents({
        participantId: staff.id,
        startDate: startOfToday().toISOString(),
      });

      if (!events || events.length === 0) {
        await managedMessage.reply(
          SmartMessage.text('Bạn không có lịch trực nhật sắp tới.'),
        );
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('📅 Lịch trực nhật của bạn')
        .setColor('#2ecc71') // Emerald green
        .setDescriptionMarkdown(
          events
            .map((event) => {
              const date = new Date(event.eventDate);
              const dateStr = format(date, 'dd/MM/yyyy');
              return `• ${dateStr}: ${event.title}`;
            })
            .join('\n'),
          {
            before: `Văn Phòng: ${staff.branch.name}\nTên: ${staff.user.name}`
          }
        )
        .setThumbnail(staff.user.avatar || 'https://cdn.mezon.ai/1779815181480628224/1999356326202839040.png')
        .setTimestamp()
        .setFooter('Bộ phận nhân sự Quy Nhơn');

      await managedMessage.reply(
        SmartMessage.build().addEmbed(embed),
      );
    } catch (error) {
      this.logger.error('Error handling cleaning schedule request', error);
      await managedMessage.reply(
        SmartMessage.text('Đã có lỗi xảy ra khi tra cứu lịch trực nhật.'),
      );
    }
  }
}
