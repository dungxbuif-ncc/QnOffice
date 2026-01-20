import { FeedbackService } from '@src/modules/feedback/feedback.service';
import { Body, Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('feedback')
export class FeebackController {
    constructor(
        private readonly feedbackService: FeedbackService
    ) { }
    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('image'))
    sendFeedback(@UploadedFile() image: Express.Multer.File, @Body("text") text: any, @Req() req: any) {
        const username = req.user?.name;
        return this.feedbackService.sendFeedbackToChannel(username, text, image);
    }
}