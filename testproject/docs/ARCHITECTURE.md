# Architecture

## High-level overview

- **Web**: Next.js App Router UI.
- **API**: Express (TypeScript) with JWT auth + RBAC.
- **DB**: Postgres via Prisma.
- **Realtime**: Ably publish/subscribe (optional).
- **Notifications**: Knock-style “in-app feed” behavior (mocked).

The project is deliberately narrow: it demonstrates the *critical* constraints of an OnlyFans-class product (identity status, media gating, payment auditability) without aiming for full feature completeness.

## Key flows

### Authentication + roles

- Users authenticate via email/password.
- API issues JWTs.
- API enforces role-based access (fan/creator/admin) server-side.

### Creator onboarding

- Creator applies → status becomes **pending**.
- Admin approves or rejects.
- Only **approved** creators can monetize.

### Content gating

Posts can be:

- FREE
- SUBSCRIBER-only
- PPV

The API always returns safe metadata, and only returns gated media access when entitled.

### Payments + ledger

Billing endpoints simulate CCBill outcomes:

- Subscribe to creator
- Unlock PPV post

Every paid action appends one or more **ledger entries** (append-only). The ledger is the system of record.

### Media storage + serving

- Upload flow stores the file and a DB record describing it.
- Serving flow checks entitlements and then streams bytes.

For dev/VM, local disk is acceptable.
For Cloud Run/serverless, object storage is recommended because the filesystem is ephemeral.

### Realtime (Ably)

- API publishes events (e.g. post created, unlock completed).
- Web subscribes to update UI without polling.
- If Ably key is missing, the app should still work (realtime becomes no-op).

## Tradeoffs

- Payments/Persona/Knock are mocked to keep scope focused on architecture.
- UI is functional rather than pixel-perfect.
- Local media storage is used for dev/VM; production should use object storage + signed URLs.
