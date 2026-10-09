import { IsString } from 'class-validator';

export class CompleteUploadDto {
  @IsString()
  storageKey: string;
}
