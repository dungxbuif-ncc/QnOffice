import { Injectable } from "@nestjs/common";
import { S3Service } from "@src/common/shared/services/s3.service";
import { EmbedBuilder, Nezon } from "@src/libs/nezon";
import { FeedbackDto } from "@src/modules/feedback/feedback.dto";
import { MezonClient } from "mezon-sdk";

@Injectable()
export class FeedbackService {
    constructor(
        private readonly mezonService: MezonClient,
        private readonly s3Service: S3Service
    ) { }
    async sendFeedbackToChannel(username: string, feedbackDto: FeedbackDto) {
        let imageUrl: string = "";
        if(feedbackDto.imageKey){
            const presignUrl = await this.s3Service.getPresignedDownloadUrl(feedbackDto.imageKey, 30000);
            imageUrl = presignUrl.downloadUrl;
        }
        
        const message = this.formatFeedbackMessage(username, feedbackDto.text, imageUrl);
        const channelId = "2013469503454711808";
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