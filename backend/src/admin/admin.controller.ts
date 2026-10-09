import { Controller, Get, UseGuards, Query, Patch, Param, Body, Post, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { GetSubmissionsDto } from './dto/get-submissions.dto.js';

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('submissions')
  async getSubmissions(@Query() query: GetSubmissionsDto) {
    return this.adminService.getSubmissions(
      query.page || 1,
      query.limit || 20,
      query.status,
    );
  }

  @Patch('submissions/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('socialUrl') socialUrl?: string,
  ) {
    return this.adminService.updateStatus(id, status as any, socialUrl);
  }

  @Patch('submissions/:id/caption')
  async updateCaption(@Param('id') id: string, @Body('socialCaption') socialCaption: string) {
    return this.adminService.updateCaption(id, socialCaption);
  }

  @Post('submissions/:id/hard-delete')
  async hardDelete(@Param('id') id: string, @Body('password') password?: string) {
    if (password !== 'hieudeptraivl') {
      throw new ForbiddenException('Sai mật khẩu bảo mật.');
    }
    return this.adminService.hardDelete(id);
  }
}
