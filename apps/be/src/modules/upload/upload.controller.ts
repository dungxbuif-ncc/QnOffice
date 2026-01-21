import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { IPresignedDownloadUrlResponse, UserRole } from '@qnoffice/shared';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { S3Service } from '@src/common/shared/services/s3.service';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsString,
    ValidateNested,
} from 'class-validator';

class FileUploadDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;
}

class GeneratePresignedUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsString()
  folder?: string;
}

class GenerateMultiplePresignedUrlsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => FileUploadDto)
  files: FileUploadDto[];

  @IsString()
  folder?: string;
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly s3Service: S3Service) {}

  @Post('presigned-url-public')
  async getPresignedUrlFeedback(@Body() dto: GeneratePresignedUrlDto) {
    return this.s3Service.getPresignedUploadUrl(dto.fileName, dto.contentType, dto.folder || 'public');
  }

  @Post('presigned-url')
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async getPresignedUrl(@Body() dto: GeneratePresignedUrlDto) {
    return this.s3Service.getPresignedUploadUrl(dto.fileName, dto.contentType);
  }

  @Post('presigned-urls')
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async getMultiplePresignedUrls(
    @Body() dto: GenerateMultiplePresignedUrlsDto,
  ) {
    return this.s3Service.getMultiplePresignedUrls(dto.files);
  }

  @Post('presigned-urls/opentalk')
  async getOpentalkPresignedUrls(
    @Body() dto: GenerateMultiplePresignedUrlsDto,
  ) {
    this.logger.log(
      `[getOpentalkPresignedUrls] Generating presigned URLs for ${dto.files.length} files`,
    );
    const result = await this.s3Service.getMultiplePresignedUrls(dto.files);
    this.logger.log(`[getOpentalkPresignedUrls] Result:`, JSON.stringify(result));
    return result;
  }

  @Post('presigned-url/opentalk/view')
  async getOpentalkViewPresignedUrl(
    @Body() dto: { slideKey: string },
  ): Promise<IPresignedDownloadUrlResponse> {
    this.logger.log(
      `[getOpentalkViewPresignedUrl] Generating view URL for key: ${dto.slideKey}`,
    );
    const result = await this.s3Service.getPresignedDownloadUrl(dto.slideKey);
    this.logger.log(
      `[getOpentalkViewPresignedUrl] Result:`,
      JSON.stringify(result),
    );
    return result;
  }
}
