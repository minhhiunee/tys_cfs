import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubmissionDto) {
    const submission = await this.prisma.submission.create({
      data: {
        content: dto.content,
        status: 'PENDING',
        media: dto.mediaIds && dto.mediaIds.length > 0 ? {
          connect: dto.mediaIds.map(id => ({ id }))
        } : undefined,
      },
    });

    return submission;
  }
}
