import { BadRequestException, Injectable } from "@nestjs/common";
import { S3Service } from "@src/common/shared/services/s3.service";
import { EmbedBuilder, Nezon } from "@src/libs/nezon";
import { MezonClient } from "mezon-sdk";

@Injectable()
export class FeedbackService {
    constructor(
        private readonly s3Service: S3Service,
        private readonly mezonService: MezonClient,
    ) { }
    async sendFeedbackToChannel(username: string, text: string, image: Express.Multer.File) {
        let imgUrl: string = '';
        if (image) {
            const res = await this.s3Service.uploadBufferFile(image)
            if (!res) {
                throw new BadRequestException("Upload ảnh thất bại");
            }
            imgUrl = res.signedUrl;
        }

        const message = this.formatFeedbackMessage(username, text, imgUrl);
        const channelId = "2013469503454711808";
        const channel = await this.mezonService.channels.fetch(channelId);
        if (!channel) {
            throw new Error(`Channel ${channelId} not found`);
        }
        const payload = message.toJSON();

        await channel.send(payload.content, payload.mentions, payload.attachments);
    }

    private formatFeedbackMessage(username: string, text: string, imageUrls: string) {
        const message = Nezon.SmartMessage.system("")

        message.addEmbed(
            new EmbedBuilder().setColor('#f0a8da')
                .setTitle(`🧑‍💼 Feedback của ${username}`)
                .setDescriptionMarkdown(text)
                .setImage(imageUrls)
        )

        return message;
    }
}