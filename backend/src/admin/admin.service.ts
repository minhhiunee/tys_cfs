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
      stats[row.status] = row._count.id;
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
    return this.prisma.submission.update({
      where: { id },
      data: { status },
      include: { media: true }
    });
  }

  async updateCaption(id: string, socialCaption: string) {
    return this.prisma.submission.update({
      where: { id },
      data: { socialCaption },
      include: { media: true }
    });
  }
}
