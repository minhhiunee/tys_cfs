import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreatePresignedUrlDto } from './dto/create-presigned-url.dto.js';
import { CompleteUploadDto } from './dto/complete-upload.dto.js';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
  PRESIGNED_URL_TTL_SECONDS,
} from '../common/constants/submission.constants.js';

@Injectable()
export class MediaService {
  private s3Client: S3Client;
  private bucketName: string;
  private cdnDomain: string;

  constructor(private readonly prisma: PrismaService) {
    this.bucketName = process.env.R2_BUCKET_NAME || 'cfs-media';
    this.cdnDomain = process.env.R2_PUBLIC_DOMAIN || '';

    // Khởi tạo S3 Client cho Cloudflare R2
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      console.warn('R2 credentials are not fully configured in .env');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  async createPresignedUrl(dto: CreatePresignedUrlDto) {
    // 1. Kiểm tra giới hạn kích thước theo loại file
    const isImage = ALLOWED_IMAGE_MIME_TYPES.includes(dto.mimeType as any);
    const isVideo = ALLOWED_VIDEO_MIME_TYPES.includes(dto.mimeType as any);

    if (isImage && dto.fileSize > IMAGE_MAX_BYTES) {
      throw new BadRequestException('Image file size exceeds the 10MB limit.');
    }
    if (isVideo && dto.fileSize > VIDEO_MAX_BYTES) {
      throw new BadRequestException('Video file size exceeds the 100MB limit.');
    }

    // 2. Tạo storage key duy nhất (chống ghi đè và ẩn danh hóa)
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const fileExtension = dto.filename.split('.').pop()?.toLowerCase() || 'bin';
    const storageKey = `submissions/${yearMonth}/${randomUUID()}.${fileExtension}`;

    // 3. Tạo presigned URL cho phép client PUT thẳng lên R2
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        ContentType: dto.mimeType,
        ContentLength: dto.fileSize,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: PRESIGNED_URL_TTL_SECONDS,
      });

      return {
        presignedUrl,
        storageKey,
        mimeType: dto.mimeType,
      };
    } catch (error) {
      console.error('Failed to generate presigned URL', error);
      throw new InternalServerErrorException('Could not generate upload URL.');
    }
  }

  async completeUpload(dto: CompleteUploadDto) {
    // 1. Kiểm tra xem file đã thực sự được đẩy lên R2 chưa (HeadObject)
    let headData;
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: dto.storageKey,
      });
      headData = await this.s3Client.send(command);
    } catch (error) {
      console.error('HeadObject failed for key:', dto.storageKey, error);
      throw new BadRequestException('File not found in storage. Upload might have failed.');
    }

    // 2. Xác định loại file dựa trên ContentType R2 trả về
    const mimeType = headData.ContentType || 'application/octet-stream';
    const type = ALLOWED_VIDEO_MIME_TYPES.includes(mimeType as any) ? 'VIDEO' : 'IMAGE';

    // 3. Tạo URL truy cập qua CDN (nếu có cấu hình, ngược lại trả về R2 url dev)
    const url = this.cdnDomain 
      ? `https://${this.cdnDomain}/${dto.storageKey}`
      : `https://pub-${this.bucketName}.r2.dev/${dto.storageKey}`; // Thay thế tạm trong dev

    // 4. Lưu metadata vào DB (submissionId sẽ được gán sau khi tạo submission thực sự)
    // Hoặc lưu nháp Media, sau đó update submissionId. Ở đây ta lưu Media mồ côi (chưa có submissionId).
    const media = await this.prisma.media.create({
      data: {
        type,
        storageKey: dto.storageKey,
        originalFilename: dto.storageKey.split('/').pop() || 'unknown',
        mimeType,
        fileSize: headData.ContentLength || 0,
      },
    });

    return {
      mediaId: media.id,
      storageKey: media.storageKey,
      type: media.type,
    };
  }
}
