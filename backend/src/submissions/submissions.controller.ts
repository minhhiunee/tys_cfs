import { Body, Controller, Post } from '@nestjs/common';
import { SubmissionsService } from './submissions.service.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  async create(@Body() createSubmissionDto: CreateSubmissionDto) {
    const submission = await this.submissionsService.create(createSubmissionDto);
    return {
      message: 'Submission received and is awaiting moderation.',
      id: submission.id,
    };
  }
}
