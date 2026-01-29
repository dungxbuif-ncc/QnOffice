import { Injectable, Logger } from '@nestjs/common';
import { ScheduleType, SwapRequestStatus } from '@qnoffice/shared';
import { formatOfficeCode } from '@src/common/utils';
import { parseDate } from '@src/common/utils/date.utils';
import {
  Arg,
  AutoContext,
  ButtonBuilder,
  ButtonStyle,
  Command,
  Component,
  EmbedBuilder,
  Prefix,
  SmartMessage,
} from '@src/libs/nezon';
import type { Nezon } from '@src/libs/nezon';
import { CleaningService } from '@src/modules/cleaning/cleaning.service';
import { StaffService } from '@src/modules/staff/staff.service';
import { SwapRequestService } from '@src/modules/swap-request/swap-request.service';
import { startOfToday, format } from 'date-fns';
import { vi } from 'date-fns/locale';

@Injectable()
export class CleaningScheduleHandler {
  private readonly logger = new Logger(CleaningScheduleHandler.name);

  constructor(
    private readonly cleaningService: CleaningService,
    private readonly staffService: StaffService,
    private readonly swapRequestService: SwapRequestService
  ) { }

  @Command({ name: 'trucnhat' })
  async onCheckMySchedule(
    @AutoContext() [managedMessage]: Nezon.AutoContext,
    @Prefix() prefix: string,
    @Arg() name: Nezon.Args,
  ) {
    const userId = managedMessage.senderId;
    this.logger.log(`User ${userId} requested cleaning schedule`);

    const officeCode = formatOfficeCode(prefix);

    try {
      const identify = name ? name.toString() : userId;
      const staff = await this.staffService.findByUserIdOrName(identify);

      if (!staff) {
        await managedMessage.reply(
          SmartMessage.system('Không có nhân viên này trong hệ thống'),
        );
        return;
      }

      if (!staff.branch.code && staff.branch.code !== officeCode) {
        await managedMessage.reply(
          SmartMessage.system(
            `Bạn không không có lịch trực tại chi nhánh ${officeCode}`,
          ),
        );
        return;
      }

      const today = startOfToday().toISOString();
      const eventCleans = await this.cleaningService.getEvents({
        startDate: today,
        participantId: staff.id,
      });
      if (!eventCleans.length) {
        await managedMessage.reply(
          SmartMessage.system('Lịch trực nhật của bạn chưa được cập nhật'),
        );
        return;
      }
      await managedMessage.reply(
        SmartMessage.system('').addEmbed(
          new EmbedBuilder()
            .setColor('#f0a8da')

            .setTitle(
              `🧑‍💼 Lịch trực nhật của bạn (thuộc Văn phòng ${staff.branch.name})`,
            )
            .setThumbnail(
              staff.user.avatar ||
              'https://cdn.mezon.ai/1779815181480628224/1999356326202839040.png',
            )
            .setDescriptionMarkdown(
              eventCleans
                .map(
                  (e) =>
                    `- ${staff.user.name} trực ${format(new Date(e.eventDate), 'EEEE', { locale: vi })} (${format(e.eventDate, 'dd/MM/yyyy')}) \n${e.title}`,
                )
                .join('/n'),
            )
            .setFooter(
              `Bộ phận Nhân sự - Văn phòng ${staff.branch.name} • ${format(new Date(), 'dd/MM/yyyy')}`,
            ),
        ),
      );
    } catch (error) {
      this.logger.log(error);
    }
  }

  @Command({ name: "lichtruc_tuan" })
  async onCheckWeekSchedule(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    const currentWeekSchedule = await this.cleaningService.getEventsCurrentWeek();

    await managedMessage.reply(
      SmartMessage.system("").addEmbed(
        new EmbedBuilder()
          .setTitle("Lịch trực nhật của tuần này")
          .setColor("#FFA500")
          .setDescriptionMarkdown(
            currentWeekSchedule.map(s => `- ${s.eventDate}: ${s.title}\n`)
          )
      )
    )
  }

  @Command({ name: "lichtruc_ngay" })
  async onCheckDaySchedule(@AutoContext() [ManagedMessage]: Nezon.AutoContext, @Arg() day: Nezon.Args) {
    const dayParse = parseDate(day.toString());
    if (!dayParse) {
      ManagedMessage.reply(SmartMessage.system("Ngày không hợp lệ"));
      return;
    }
    const eventClean = await this.cleaningService.getEventByDay(dayParse);
    if (!eventClean) {
      ManagedMessage.reply(SmartMessage.system(`Ngày ${day} chưa được phân công`));
      return;
    }
    ManagedMessage.reply(SmartMessage.system(`${eventClean.eventDate}: ${eventClean.title}`));
  }

  @Command('doilich')
  async onChangeSchedule(
    @AutoContext() [managedMessage]: Nezon.AutoContext,
  ) {
    await managedMessage.replyEphemeral(
      SmartMessage.build()
        .addEmbed(
          new EmbedBuilder()
            .setColor('#E91E63')
            .setTitle('Form đổi lịch trực nhật')
            .addTextField('Người muốn đổi', 'name', {
              placeholder: 'ten.hodem',
              defaultValue: '',
            })
            .addTextField('Ngày của bạn muốn đổi', 'fromDay', {
              placeholder: 'dd/MM/yyyy',
            })
            .addTextField('Ngày của người khác mà bạn muốn đổi', 'toDay', {
              placeholder: 'dd/MM/yyyy',
            })
            .addTextField('Lý do', 'reason', {
              placeholder: '...',
            })
            .setTimestamp()
            .setFooter('Powered by QNOffice', 'https://example.com/icon.jpg')
        )
        .addButton(
          new ButtonBuilder()
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
            .onClick(async (context) => {
              await managedMessage.replyEphemeral(SmartMessage.text('Bạn đã hủy yêu cầu đổi lịch trực nhật'));
              await context.message.deleteEphemeral();
            })
        )
        .addButton(
          new ButtonBuilder()
            .setLabel('Create')
            .setStyle(ButtonStyle.Success)
            .onClick(async (context) => {
              const { name, fromDay, toDay, reason } = context.formData ?? {};
              if (!name || !fromDay || !toDay || !reason) {
                await managedMessage.replyEphemeral(SmartMessage.text('Yêu cầu nhập đầy đủ thông tin!'));
                return;
              }

              if (!parseDate(fromDay) || !parseDate(toDay)) {
                await managedMessage.replyEphemeral(SmartMessage.text('Ngày tháng không hợp lệ!'));
                return
              }

              const staff = await this.staffService.findByName(name);
              if (!staff) {
                await managedMessage.replyEphemeral(SmartMessage.text('Không có nhân viên này!'));
                return;
              }

              const sender = await this.staffService.findByUserId(managedMessage.senderId);

              if (!sender) {
                await managedMessage.replyEphemeral(SmartMessage.text('Không có nhân viên này!'));
                return;
              }

              // const today = startOfToday().toISOString();
              const fromEvent = await this.cleaningService.getEvent({
                // startDate: today,
                participantId: sender.id,
              });

              if (!fromEvent) {
                await managedMessage.reply(SmartMessage.text('Bạn không có lịch trực vào ngày này!'));
                return;
              }

              const toEvent = await this.cleaningService.getEvent({
                // startDate: today,
                participantId: staff.id,
              })

              if (!toEvent) {
                await managedMessage.reply(SmartMessage.text('Người bị yêu cầu không có lịch trực vào ngày này!'));
                return;
              }

              await this.swapRequestService.create({ fromEventId: fromEvent.id, toEventId: toEvent.id, reason: reason, type: ScheduleType.CLEANING, targetStaffId: staff.id }, sender.id);
              await managedMessage.reply(SmartMessage.text(`Tạo yêu cầu đổi lịch trực nhật thành công với {{recipient}}.`)
                .addMention({
                  recipient: {
                    username: staff.user.name,
                    userId: staff.userId!,
                  }
                })
              );

              await context.message.deleteEphemeral();
            })
        )
    );
  }

  @Component({ pattern: "cancel" })
  async onConfirm(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    await managedMessage.reply(SmartMessage.text('Confirmed!'));
  }

  @Command({ name: "huy_doilich" })
  async onCancel(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    try {
      const requester = await this.staffService.findByUserId(managedMessage.senderId);
      if (!requester) {
        await managedMessage.reply(SmartMessage.text('Không có nhân viên này!'));
        return;
      }
      const listSwap = await this.swapRequestService.findByUserId(requester.id);
      if (!listSwap) {
        await managedMessage.reply(SmartMessage.text('Bạn không có yêu cầu đổi lịch nào!'));
        return;
      }
      const lastRequest = listSwap.pop();
      await this.swapRequestService.delete(lastRequest!.id);
      await managedMessage.reply(SmartMessage.text('Xóa yêu cầu đổi lịch thành công!'));
    } catch (error) {
      await managedMessage.reply(SmartMessage.text('Xóa yêu cầu đổi lịch thất bại!'));
      return;
    }
  }

  @Command({ name: "yc_doilich" })
  async onGetListRequestSwap(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    const requester = await this.staffService.findByUserId(managedMessage.senderId);
    if (!requester) {
      await managedMessage.reply(SmartMessage.text('Không có nhân viên này!'));
      return;
    }
    const list = await this.swapRequestService.findAll({ requesterId: requester.id, status: SwapRequestStatus.PENDING });
    const listRequest = list.map(async (s) => {
      const target = await this.staffService.findById(s.targetStaffId!);
      return { label: `- ${s.requester.user.name}(${s.fromEvent.eventDate}) 🔁 ${target?.user.name}(${s.toEvent.eventDate})`, value: s.id.toString() }
    })
    const resolvedStrings = await Promise.all(listRequest);

    await managedMessage.reply(
      SmartMessage.system("").addEmbed(
        new EmbedBuilder()
          .setTitle("Danh sách yêu cầu đổi lịch")
          .setColor("#FFA500")
          .addSelectField("Yêu cầu", "id", resolvedStrings)
      ).addButton(
        new ButtonBuilder().setLabel("Approve").setStyle(ButtonStyle.Success).onClick(async (context) => {
          const staff = await this.staffService.findByUserId(managedMessage.senderId);
          if (!staff) throw new Error("Không tìm thấy nhân viên này!");
          if (staff.role === 1 || staff.role === 0) {
            if (!context.formData) {
              await managedMessage.replyEphemeral(SmartMessage.text('Bạn chưa chọn yêu cầu đổi lịch nào!'));
              return;
            }
            await this.swapRequestService.review(Number(context.formData.id), { status: SwapRequestStatus.APPROVED })
            await managedMessage.reply(SmartMessage.text('Yêu cầu đổi lịch trực nhật đã được duyệt'));
            await context.message.delete();
          } else {
            await managedMessage.reply(SmartMessage.text('Chỉ có GDVP hoặc HR mới được duyệt'));
            await context.message.delete();
          }
        })
      )
        .addButton(
          new ButtonBuilder().setLabel("Reject").setStyle(ButtonStyle.Danger).onClick(async (context) => {
            await managedMessage.replyEphemeral(SmartMessage.text('Bạn đã hủy yêu cầu đổi lịch trực nhật'));
            await context.message.delete();
          })
        )
    )
  }
}

