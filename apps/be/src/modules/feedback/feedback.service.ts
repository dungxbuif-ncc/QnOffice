import { Injectable } from "@nestjs/common";
import { S3Service } from "@src/common/shared/services/s3.service";
import { EmbedBuilder, Nezon } from "@src/libs/nezon";
import { FeedbackDto } from "@src/modules/feedback/Feedback.dto";
import { MezonClient } from "mezon-sdk";

@Injectable()
export class FeedbackService {
    constructor(
        private readonly mezonService: MezonClient,
        private readonly s3Service: S3Service
    ) { }
    async sendFeedbackToChannel(username: string, feedbackDto: FeedbackDto) {
        const presignUrl = await this.s3Service.getPresignedDownloadUrl(feedbackDto.imageKey, 30000)
        const message = await this.formatFeedbackMessage(username, feedbackDto.text, presignUrl.downloadUrl);
        // const channelId = "2013469503454711808";
        const channelId = "2011979291633389568"; // test clan
        const channel = await this.mezonService.channels.fetch(channelId);
        if (!channel) {
            throw new Error(`Channel ${channelId} not found`);
        }
        const payload = message.toJSON();

        await channel.send(payload.content, payload.mentions, payload.attachments);
    }

    private formatFeedbackMessage(username: string, text: string, imageUrl: string) {
        const message = Nezon.SmartMessage.system("")

        message.addEmbed(
            new EmbedBuilder().setColor('#f0a8da')
                .setTitle(`🧑‍💼 Feedback của ${username}`)
                .setDescriptionMarkdown(text)
                .setImage(imageUrl)
        )

        return message;
    }
}