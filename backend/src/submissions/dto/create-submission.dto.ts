import { IsString, MaxLength, MinLength, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  SUBMISSION_CONTENT_MAX_LENGTH,
  SUBMISSION_CONTENT_MIN_LENGTH,
} from '../../common/constants/submission.constants.js';

export class CreateSubmissionDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(SUBMISSION_CONTENT_MIN_LENGTH, {
    message: `Confession must be at least ${SUBMISSION_CONTENT_MIN_LENGTH} characters.`,
  })
  @MaxLength(SUBMISSION_CONTENT_MAX_LENGTH, {
    message: `Confession is too long. Maximum is ${SUBMISSION_CONTENT_MAX_LENGTH} characters.`,
  })
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaIds?: string[];
}
