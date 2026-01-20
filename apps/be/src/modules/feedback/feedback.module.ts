import { FeedbackService } from '@src/modules/feedback/feedback.service';
import { Module } from "@nestjs/common";
import { FeebackController } from '@src/modules/feedback/feedback.controller';
import { SharedModule } from '@src/common/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [FeebackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}