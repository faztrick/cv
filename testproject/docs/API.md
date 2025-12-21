# API Overview

Base URL (local): `http://localhost:4000`

Health:

- `GET /health` → `{ "status": "ok" }`

> Exact endpoints may evolve; use this document as a reviewer map and consult route files for definitive behavior.

## Authentication

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

JWT is provided in:

- `Authorization: Bearer <token>`

## Creator

- `POST /creator/apply` (creator role)

## Posts

- `GET /posts` (public feed; gating applied)
- `POST /posts` (creator role; supports multipart + media)

## Billing (mock)

- `POST /billing/subscribe` (fan role)
- `POST /billing/unlock` (fan role)

Both write to the append-only ledger.

## Media

- `GET /media/:assetId`

Must enforce entitlements and only stream bytes when authorized.

## Notifications

- In-app notifications (Knock-style) are available via notifications routes.

## Admin

- Admin-only endpoints to:
  - view users
  - view creators
  - approve/reject creators
  - disable creators/posts
  - view transactions (ledger)

See:

- API routes: `apps/api/src/routes/*.ts`
