# CFS Platform

Anonymous confession/content submission platform with admin moderation and social-media preparation (manual publish).

**Stack:** Next.js, NestJS, Prisma, PostgreSQL, Cloudflare R2.

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- Docker Desktop (for local PostgreSQL), or a remote Postgres URL

## Installation

```bash
git clone <repository-url>
cd "Web CFS TYS"

npm install --prefix backend
npm install --prefix frontend
```

Or from the repo root after enabling workspaces:

```bash
npm install
```

## Environment setup

1. **Backend** — copy `backend/.env.example` to `backend/.env`:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Frontend** — copy `frontend/.env.example` to `frontend/.env.local`:

   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

See `.env.example` at the repo root for a variable index.

## Database setup

Start PostgreSQL locally:

```bash
docker compose up -d
```

Default connection (matches `backend/.env.example`):

`postgresql://cfs:cfs@localhost:5432/cfs?schema=public`

## Prisma

Generate the client and apply migrations:

```bash
npm run prisma:generate --prefix backend
npm run prisma:migrate --prefix backend
```

For production deploys:

```bash
npm run prisma:migrate:deploy --prefix backend
```

Schema: `prisma/schema.prisma`.

## Local development

Terminal 1 — API (port **3001**):

```bash
npm run start:dev --prefix backend
```

Terminal 2 — frontend (port **3000**):

```bash
npm run dev --prefix frontend
```

- Public site: http://localhost:3000  
- API health: http://localhost:3001/api/health  

## Production build

```bash
npm run build --prefix backend
npm run build --prefix frontend
npm run start:prod --prefix backend
npm run start --prefix frontend
```

## Deployment (outline)

| Component | Target |
|-----------|--------|
| Frontend | Vercel — set `NEXT_PUBLIC_API_URL` |
| API | Render, Koyeb, or similar — set `DATABASE_URL`, `JWT_SECRET`, R2 vars, `FRONTEND_URL` |
| Database | Supabase PostgreSQL |
| Media | Cloudflare R2 (private bucket + CORS for browser uploads) |

Run `prisma migrate deploy` as part of the API release process.

## Project structure

```
frontend/          Next.js App Router
backend/           NestJS API
prisma/            Schema and migrations
docs/              Architecture and API notes
docker-compose.yml Local Postgres
```

## Scripts (repo root)

| Script | Description |
|--------|-------------|
| `npm run db:up` | Start Docker Postgres |
| `npm run db:down` | Stop Docker Postgres |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:generate` | Prisma generate |

## Development phases

1. **Phase 1** — Project setup (current)
2. Phase 2 — Admin authentication
3. Phase 3 — Anonymous submission
4. Phase 4 — R2 presigned uploads
5. Phase 5 — Admin dashboard
6. Phase 6 — Moderation workflow
7. Phase 7 — Social preparation
8. Phase 8 — Security hardening
9. Phase 9 — Testing
10. Phase 10 — Deployment

## License

Private / UNLICENSED — adjust for your organization.
