import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const counts = await this.prisma.submission.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const stats = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      POSTED: 0,
      HIDDEN: 0,
    };

    for (const row of counts) {
      stats[row.status as keyof typeof stats] = row._count.id;
    }

    return stats;
  }
  async getSubmissions(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    
    const where = status ? { status: status as any } : {};

    const [items, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          media: true,
          socialPosts: {
            orderBy: { createdAt: 'desc' }
          },
        },
      }),
      this.prisma.submission.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(id: string, status: any) {
    const data: any = { status };
    
    // Auto-update timestamps based on status
    if (status === 'APPROVED') data.approvedAt = new Date();
    if (status === 'REJECTED') data.rejectedAt = new Date();
    if (status === 'POSTED') data.postedAt = new Date();

    return this.prisma.submission.update({
      where: { id },
      data,
      include: { media: true, socialPosts: { orderBy: { createdAt: 'desc' } } }
    });
  }

  async updateCaption(id: string, socialCaption: string) {
    return this.prisma.submission.update({
      where: { id },
      data: { socialCaption },
      include: { media: true, socialPosts: { orderBy: { createdAt: 'desc' } } }
    });
  }

  async addSocialPost(submissionId: string, data: { platform: any, externalUrl?: string, caption?: string }) {
    await this.prisma.socialPost.create({
      data: {
        submissionId,
        platform: data.platform,
        externalUrl: data.externalUrl,
        caption: data.caption,
        postedAt: new Date(),
      }
    });

    return this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { media: true, socialPosts: { orderBy: { createdAt: 'desc' } } }
    });
  }

  async hardDelete(id: string) {
    // Due to Cascade on media and other relations, this will cleanly delete it from DB.
    // Note: Cloudflare R2 files will remain orphaned in storage, but DB will be clean.
    return this.prisma.submission.delete({
      where: { id },
    });
  }
}
