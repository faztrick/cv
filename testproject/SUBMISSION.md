# FanHouse — Engineering Test (Vertical Slice) — Submission

This repository is a production-minded vertical slice of **FanHouse** (OnlyFans-class creator platform), focused on correct architecture and platform constraints: identity, gating, payments, media, realtime, and admin control.

> Important: the product concept is NSFW, but this implementation uses **SFW placeholder content**. The evaluation target here is systems correctness (auth, entitlements, ledger, media security), not adult content.

---

## ✅ Deliverables

1) **GitHub repository**: this repo

2) **Running app**:

- **Local**: see root `README.md`
- **Ubuntu VM (Docker Compose)**: `deploy/vm/README.md`
- **GCP (Cloud Run + Cloud SQL)**: `deploy/gcp/README.md`

1) **README**:

- Root `README.md` is the primary setup + architecture overview.
- Additional deep-dive docs live in `docs/`.

1) **Loom video (3–5 min)**:

- Use `docs/LOOM_OUTLINE.md` as the script.

---

## Stack (as implemented)

### Web

- Next.js (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui-style components

### API

- Node.js (TypeScript) + Express
- PostgreSQL (Prisma)

### Realtime

- Ably (optional; app degrades gracefully when key is not set)

### Identity (Persona)

- Mocked state machine with required statuses: pending/approved/rejected

### Notifications (Knock)

- Knock-style in-app notifications (mocked)

### Media

- Upload + gated streaming (API-enforced)
- Local storage for dev/VM; object storage recommended for serverless

### Payments

- Mock CCBill flows (subscribe + PPV unlock)
- **Append-only ledger** for all financial actions

---

## Requirements → Implementation Map

| Requirement | Implemented | Where |
|---|---:|---|
| Auth + roles (fan/creator/admin) | ✅ | `apps/api/src/routes/auth.ts`, `apps/api/src/middleware/auth.ts` |
| Creator onboarding + verification states | ✅ | `apps/api/src/routes/creator.ts`, admin actions in `apps/api/src/routes/admin.ts` |
| Posts + gating (subscriber / PPV) | ✅ | `apps/api/src/routes/posts.ts`, `apps/api/src/routes/media.ts` |
| Payments mocked (subscribe + unlock) | ✅ | `apps/api/src/routes/billing.ts` |
| Ledger (append-only, auditable) | ✅ | `apps/api/src/services/ledger.ts`, admin view in `apps/api/src/routes/admin.ts` |
| Realtime feature (Ably) | ✅ (optional key) | `apps/api/src/services/ably.ts`, web client subscribes via `apps/web/src/lib/realtime.ts` |
| Admin panel `/admin` | ✅ | `apps/web/src/app/admin/page.tsx`, API routes in `apps/api/src/routes/admin.ts` |
| Media upload + gated access | ✅ | upload in `apps/api/src/routes/posts.ts`, stream in `apps/api/src/routes/media.ts` |

---

## Docs index

- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/API.md`
- `docs/DEPLOYMENT_GCP.md`
- `docs/DEPLOYMENT_VM.md`
- `docs/LOOM_OUTLINE.md`
