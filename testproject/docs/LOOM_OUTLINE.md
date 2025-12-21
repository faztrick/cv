# Loom video outline (3–5 minutes)

## 1) What you built (20–30s)

- A vertical slice proving auth, onboarding, gating, payments/ledger, media, realtime, and admin control.

## 2) Architecture overview (60–90s)

- Next.js App Router UI
- Express API
- Postgres via Prisma
- Ably realtime (optional)

## 3) Data model (60–90s)

- Users + roles
- CreatorProfile verification states
- Posts (FREE/SUBSCRIBER/PPV)
- Subscriptions + PPV unlocks
- Ledger entries are append-only and auditable

## 4) One smart decision (30–45s)

Pick one:

- enforce entitlements at media streaming endpoint (not only in UI)
- append-only ledger (no mutable balance as truth)
- graceful degradation when Ably key isn’t provided

## 5) One shortcut you knowingly took (30–45s)

Pick one:

- mocked Persona/Knock/CCBill
- local uploads in dev/VM (object storage for production)
- minimal UI polish in favor of correctness

## 6) How to run (20–30s)

- Local: Postgres via docker compose; run API + web
- VM: `docker-compose.vm.yml` + `.env.vm`
- GCP: Cloud Run + Cloud SQL
