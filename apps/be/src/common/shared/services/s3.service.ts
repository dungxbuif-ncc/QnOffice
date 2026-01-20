import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
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

    // Set public URL for file access
    if (s3Config.publicUrl) {
      this.publicUrl = s3Config.publicUrl;
    } else if (s3Config.endpoint) {
      this.publicUrl = s3Config.endpoint;
    } else {
      this.publicUrl = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com`;
    }

    this.s3Client = new S3Client({
      region: 'auto', // R2 always requires 'auto' region
      endpoint: s3Config.endpoint,
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
    });

    // Generate the final public URL for R2
    const fileUrl = `${this.publicUrl}/${this.bucket}/${key}`;

    console.log('Generated presigned URL:', {
      uploadUrl,
      fileUrl,
      bucket: this.bucket,
      key,
      endpoint: this.appConfigService.s3Config.endpoint,
      publicUrl: this.publicUrl,
    });

    return {
      uploadUrl,
      fileUrl,
      key,
      expiresIn,
    };
  }

  async getPresignedDownloadUrl(
    key: string,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const expiresIn = 3600; // 1 hour
    const downloadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    return {
      downloadUrl,
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

  async uploadBufferFile(
    file: Express.Multer.File,
    folder = 'feedback/temp',
    expire: number = 300000
  ) {

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files allowed');
    }

    const ext = file.originalname.split('.').pop() || 'png';
    const key = `${folder}/${this.generatorService.uuid()}.${ext}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    const signedUrl = await getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      {
        expiresIn: expire, 
      },
    );

    return {
      key,
      signedUrl,
      size: file.size,
      mimetype: file.mimetype,
      originalName: file.originalname,
    };
  }

  async uploadMultipleBuffers(
    files: Express.Multer.File[],
    folder = 'feedback/temp',
    expired?: number
  ) {
    return Promise.all(
      files.map((file) => this.uploadBufferFile(file, folder, expired)),
    );
  }
}

