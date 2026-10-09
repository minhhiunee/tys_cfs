import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { SocialPlatform } from '@prisma/client';

export class AddSocialPostDto {
  @IsEnum(SocialPlatform)
  @IsNotEmpty()
  platform: SocialPlatform;

  @IsString()
  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @IsString()
  @IsOptional()
  caption?: string;
}
