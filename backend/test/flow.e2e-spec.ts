import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module.js';

describe('Submission Flow (e2e)', () => {
  let app: INestApplication<App>;
  let submissionId: string;
  let authCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. POST /api/submissions (Anonymous submission)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/submissions')
      .send({
        content: 'This is a test confession from e2e tests that is long enough.',
        mediaIds: [],
      })
      .expect(201);

    expect(response.body.message).toBe('Submission received and is awaiting moderation.');
    expect(response.body.id).toBeDefined();
    submissionId = response.body.id;
  });

  it('2. GET /api/admin/submissions (Unauthorized access without cookie)', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/submissions')
      .expect(401);
  });

  it('3. POST /api/auth/login (Admin login)', async () => {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@cfs.local';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    
    // Extract the token cookie for subsequent requests
    const cookie = cookies.find((c: string) => c.startsWith('cfs_token='));
    expect(cookie).toBeDefined();
    authCookie = cookie.split(';')[0];
    expect(authCookie).toBeDefined();
  });

  it('4. PATCH /api/admin/submissions/:id/status (Approve submission)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/admin/submissions/${submissionId}/status`)
      .set('Cookie', authCookie)
      .send({ status: 'APPROVED' })
      .expect(200);

    expect(response.body.status).toBe('APPROVED');
    expect(response.body.approvedAt).toBeDefined();
  });

  it('5. PATCH /api/admin/submissions/:id/status (Mark as posted)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/admin/submissions/${submissionId}/status`)
      .set('Cookie', authCookie)
      .send({ status: 'POSTED' })
      .expect(200);

    expect(response.body.status).toBe('POSTED');
    expect(response.body.postedAt).toBeDefined();
  });

  it('6. POST /api/admin/submissions/:id/social-posts (Add social post link)', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/admin/submissions/${submissionId}/social-posts`)
      .set('Cookie', authCookie)
      .send({ platform: 'FACEBOOK', externalUrl: 'https://facebook.com/test' })
      .expect(201);

    expect(response.body.socialPosts).toBeDefined();
    expect(response.body.socialPosts.length).toBeGreaterThan(0);
    expect(response.body.socialPosts[0].platform).toBe('FACEBOOK');
  });
});
