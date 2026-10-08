import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';

export type AuditAction =
  | 'LOGIN'
  | 'APPROVE_SUBMISSION'
  | 'REJECT_SUBMISSION'
  | 'HIDE_SUBMISSION'
  | 'EDIT_SUBMISSION'
  | 'MARK_AS_POSTED'
  | 'DELETE_MEDIA';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget audit log entry. Never throws to the caller. */
  async log(
    adminId: string,
    action: AuditAction,
    submissionId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminId,
          action,
          submissionId: submissionId ?? null,
          metadata: (metadata as Prisma.InputJsonValue) ?? undefined,
        },
      });
    } catch (error) {
      // Audit logging must never break the main workflow.
      this.logger.error(`Failed to write audit log: ${action}`, error);
    }
  }
}
