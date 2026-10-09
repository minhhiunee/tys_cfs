import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
} from '../../common/constants/submission.constants.js';

const ALL_MIME_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_VIDEO_MIME_TYPES];

export class CreatePresignedUrlDto {
  @IsString()
  filename: string;

  @IsString()
  @IsIn(ALL_MIME_TYPES, {
    message: 'MIME type is not supported.',
  })
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(Math.max(IMAGE_MAX_BYTES, VIDEO_MAX_BYTES), {
    message: 'File size exceeds absolute maximum allowed.',
  })
  fileSize: number;
}
