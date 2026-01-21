import { FeedbackService } from '@src/modules/feedback/feedback.service';
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { FeedbackDto } from '@src/modules/feedback/feedback.dto';

@Controller('feedback')
export class FeebackController {
    constructor(
        private readonly feedbackService: FeedbackService
    ) { }
    @Post()
    @UseGuards(JwtAuthGuard)
    sendFeedback(@Body() feedbackDto: FeedbackDto, @Req() req: any) {
        const username = req.user?.name;
        return this.feedbackService.sendFeedbackToChannel(username, feedbackDto);
    }
}