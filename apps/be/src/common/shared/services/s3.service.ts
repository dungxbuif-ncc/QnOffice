import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { GeneratorService } from './generator.service';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresIn: number;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly generatorService: GeneratorService,
  ) {
    const s3Config = this.appConfigService.s3Config;
    this.bucket = s3Config.bucket;

    if (s3Config.endpoint) {
      this.publicUrl = s3Config.publicUrl || s3Config.endpoint;
    } else if (s3Config.publicUrl) {
      this.publicUrl = s3Config.publicUrl;
    } else {
      this.publicUrl = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com`;
    }

    this.s3Client = new S3Client({
      region: s3Config.region,
      endpoint: s3Config.endpoint,
      forcePathStyle: !!s3Config.endpoint,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });
  }

  async getPresignedUploadUrl(
    fileName: string,
    contentType: string,
    folder: string = 'penalties/evidence',
  ): Promise<PresignedUrlResponse> {
    // Generate unique file key
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${this.generatorService.uuid()}.${fileExtension}`;
    const key = `${folder}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL that expires in 1 hour for Cloudflare R2
    const expiresIn = 3600; // 1 hour
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
      signableHeaders: new Set(['host']), // Only sign host header for R2 compatibility
    });

    // Generate the final public URL
    const fileUrl = `${this.publicUrl}/${this.bucket}/${key}`;

    console.log('Generated presigned URL:', {
      uploadUrl,
      fileUrl,
      bucket: this.bucket,
      key,
      endpoint: this.appConfigService.s3Config.endpoint,
    });

    return {
      uploadUrl,
      fileUrl,
      key,
      expiresIn,
    };
  }

  async getMultiplePresignedUrls(
    files: Array<{ fileName: string; contentType: string }>,
    folder: string = 'penalties/evidence',
  ): Promise<PresignedUrlResponse[]> {
    const promises = files.map((file) =>
      this.getPresignedUploadUrl(file.fileName, file.contentType, folder),
    );

    return Promise.all(promises);
  }
}
