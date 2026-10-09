import { Body, Controller, Post } from '@nestjs/common';
import { MediaService } from './media.service.js';
import { CreatePresignedUrlDto } from './dto/create-presigned-url.dto.js';
import { CompleteUploadDto } from './dto/complete-upload.dto.js';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-url')
  async getPresignedUrl(@Body() dto: CreatePresignedUrlDto) {
    return this.mediaService.createPresignedUrl(dto);
  }

  @Post('complete')
  async completeUpload(@Body() dto: CompleteUploadDto) {
    return this.mediaService.completeUpload(dto);
  }
}
