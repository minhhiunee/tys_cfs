import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { HealthModule } from './health/health.module.js';
import { MediaModule } from './media/media.module.js';
import { SocialPostsModule } from './social-posts/social-posts.module.js';
import { SubmissionsModule } from './submissions/submissions.module.js';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    AdminModule,
    SubmissionsModule,
    MediaModule,
    SocialPostsModule,
    AuditModule,
  ],
})
export class AppModule {}
