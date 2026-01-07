import { Module } from '@nestjs/common';
import { SharedModule } from '@src/common/shared/shared.module';
import { UploadController } from './upload.controller';

@Module({
  imports: [SharedModule],
  controllers: [UploadController],
})
export class UploadModule {}
