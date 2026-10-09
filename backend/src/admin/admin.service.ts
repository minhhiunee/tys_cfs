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
}
