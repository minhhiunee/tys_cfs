# API (planned)

Base URL: `{API_HOST}/api`

## Error format

```json
{
  "statusCode": 400,
  "code": "INVALID_FILE_TYPE",
  "message": "Human-readable message",
  "details": []
}
```

## Phase 1 (implemented)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Liveness check |

## Public (Phase 3–4)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/submissions` | Create submission |
| POST | `/media/presigned-url` | Get R2 upload URL |
| POST | `/media/complete` | Finalize upload metadata |

## Auth (Phase 2)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Admin login |
| POST | `/auth/logout` | Admin logout |
| GET | `/auth/me` | Current admin |

## Admin (Phase 5–7)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard/stats` | Counts by status |
| GET | `/admin/submissions` | Paginated list |
| GET | `/admin/submissions/:id` | Detail |
| PATCH | `/admin/submissions/:id` | Caption / notes |
| POST | `/admin/submissions/:id/approve` | Approve |
| POST | `/admin/submissions/:id/reject` | Reject |
| POST | `/admin/submissions/:id/hide` | Hide |
| POST | `/admin/submissions/:id/mark-posted` | Mark posted |

## Validation limits

| Field | Rule |
|-------|------|
| Content | 10–5000 characters, whitespace normalized |
| Images | JPEG, PNG, WebP; max 10 MB; up to 5 per submission |
| Videos | MP4, MOV (`video/quicktime`); max 100 MB; up to 1 per submission |
| Presign TTL | 900 seconds |

Constants live in `backend/src/common/constants/submission.constants.ts`.
