# FanHouse Test Project (Vertical Slice)

This project is a focused vertical slice of FanHouse: authentication, creator onboarding, gated content, mock payments + ledger, realtime updates, and admin controls.

## Stack

- **Frontend:** Next.js App Router, TypeScript, TailwindCSS, shadcn/ui-style components
- **Backend:** Node.js + Express (TypeScript)
- **Database:** PostgreSQL via Prisma
- **Realtime:** Ably (optional key)
- **Notifications:** Knock-style in-app feed (mocked)

## Quick Start

### 1) Start Postgres

```bash
docker compose up -d
```

### 2) API setup

```bash
cd apps/api
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

### 3) Web setup

```bash
cd ../web
cp .env.local.example .env.local
npm install
npm run dev
```

### Demo Accounts (seeded)

- Admin: `admin@fanhouse.test` / `admin123`
- Fan: `fan@fanhouse.test` / `fan123`
- Creator: `creator@fanhouse.test` / `creator123`

## Core Flows

- **Auth + Roles:** fan, creator, admin via JWT.
- **Creator onboarding:** apply -> pending -> admin approval.
- **Content gating:** free, subscriber-only, or PPV (API enforced).
- **Payments:** mock subscription + PPV unlock with append-only ledger entries.
- **Realtime:** Ably channel `posts` publishes `post.created` and `ppv.unlocked` events.
- **Admin panel:** approve/reject/disable creators, view ledger.

## Project Structure

```
apps/
  api/        # Express API + Prisma
  web/        # Next.js App Router UI
flutter_frontend/  # Optional Flutter client (extra)
```

## App pages

### Web (Next.js App Router)

- `/` → `apps/web/src/app/page.tsx`
- `/auth` → `apps/web/src/app/auth/page.tsx`
- `/feed` → `apps/web/src/app/feed/page.tsx`
- `/creator` → `apps/web/src/app/creator/page.tsx`
- `/admin` → `apps/web/src/app/admin/page.tsx`

### Flutter (GetX)

Routes are declared in `flutter_frontend/lib/app/routes/app_routes.dart` and registered in `flutter_frontend/lib/app/routes/app_pages.dart`.

- `/` → `flutter_frontend/lib/app/modules/home/views/home_view.dart`
- `/auth` → `flutter_frontend/lib/app/modules/auth/views/auth_view.dart`
- `/feed` → `flutter_frontend/lib/app/modules/feed/views/feed_view.dart`
- `/creator` → `flutter_frontend/lib/app/modules/creator/views/creator_view.dart`
- `/creator/new` → `flutter_frontend/lib/app/modules/creator/views/create_post_view.dart`
- `/admin` → `flutter_frontend/lib/app/modules/admin/views/admin_view.dart`
- `/notifications` → `flutter_frontend/lib/app/modules/notifications/views/notifications_view.dart`

## Tradeoffs

- Media access uses a short-lived token query param for the image tag in the demo.
- Notifications are stored in Postgres instead of calling Knock directly.
- Ably is optional: without a key, the realtime UI shows a placeholder.

## Deliverables (Submission Checklist)

- **GitHub repo:** this repository
- **Running app:** see Quick Start above (local)
- **README:** this file (setup + architecture + tradeoffs)
- **Loom video (3–5 min):** _add link here_
  - Architecture walkthrough
  - Data model overview
  - One smart decision
  - One shortcut knowingly taken

## Environment variables

### Web (`apps/web/.env.local`)

- `NEXT_PUBLIC_API_URL` (default: `http://localhost:4000`)
- `NEXT_PUBLIC_ABLY_KEY` (optional) — when unset, the app runs without realtime.

### API (`apps/api/.env`)

- Copy from `apps/api/.env.example`

## Notes

- Uploads are saved locally in `apps/api/uploads/`.
- Prisma schema lives in `apps/api/prisma/schema.prisma`.

## Tests

### API (Vitest)

API tests live in `apps/api/__tests__/` and run with a mocked Prisma client (no DB required).

- Watch mode:
  - `cd apps/api` → `npm test`
- One-shot run (CI-style):
  - `cd apps/api` → `npx vitest run`

### Web (Playwright E2E)

Basic E2E tests live in `apps/web/e2e/` and are configured via `apps/web/playwright.config.ts`.

- Run E2E tests (will start the web dev server automatically):
  - `cd apps/web` → `npm run test:e2e`

## Deploy

- **GCP (Cloud Run + Cloud SQL):** see `deploy/gcp/README.md`
- **Flutter Web hosting (Firebase/GCS):** see `deploy/gcp/flutter-web.md`

## Troubleshooting

### Next.js monorepo + Tailwind module resolution

If you see an error like “Can’t resolve `tailwindcss`” while running the web app, it usually means Next/Turbopack inferred the monorepo root incorrectly and is resolving dependencies from a parent folder.

This repo pins the app root/tracing in:

- `apps/web/next.config.js`
- `apps/web/next.config.ts`

## Next Steps

- Add a CI-friendly test script (e.g. `vitest run`) and GitHub Actions pipeline.
- Swap mock payment hooks for actual CCBill workflows.
- Replace local media with object storage and signed URLs.
