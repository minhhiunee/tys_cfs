# Architecture

## Overview

CFS is a monorepo with a **Next.js** public/admin frontend and a **NestJS** REST API. PostgreSQL stores workflow metadata; **Cloudflare R2** stores media binaries (Phase 4+).

```
Browser → Next.js (Vercel)
       → NestJS API (/api)
       → PostgreSQL (Supabase / local Docker)
Browser → R2 (presigned PUT, Phase 4+)
```

## Modules (backend)

| Module | Responsibility |
|--------|----------------|
| `auth` | Admin login, session/JWT cookies |
| `submissions` | Anonymous create + validation |
| `media` | Presigned URLs, upload completion |
| `admin` | Dashboard, moderation, listings |
| `social-posts` | External platform post records |
| `audit` | Admin action audit log |
| `common` | Prisma, filters, shared constants |

## Submission lifecycle

`PENDING` → `APPROVED` | `REJECTED` → `POSTED` (manual social publish) → optional `HIDDEN`.

Invalid transitions are rejected on the server.

## Security baseline

- Server-side validation and status rules
- HttpOnly cookies for admin auth (Phase 2)
- Private R2 bucket with presigned access
- Rate limits on public endpoints (Phase 8)

See the master specification for full requirements.
