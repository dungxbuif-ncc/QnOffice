import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@qnoffice/shared';
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
}

class GenerateMultiplePresignedUrlsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => FileUploadDto)
  files: FileUploadDto[];
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

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
    return this.s3Service.getMultiplePresignedUrls(dto.files);
  }

  @Post('presigned-url/opentalk/view')
  async getOpentalkViewPresignedUrl(@Body() dto: { slideKey: string }) {
    return this.s3Service.getPresignedDownloadUrl(dto.slideKey);
  }
}
