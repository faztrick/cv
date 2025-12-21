# Data Model (Conceptual)

The Prisma schema is in `apps/api/prisma/schema.prisma`.

This doc describes the conceptual model and invariants reviewers should care about.

## Core entities

### User

- Role-based access:
  - FAN
  - CREATOR
  - ADMIN

### CreatorProfile

- 1:1 with a creator User
- Verification status (Persona-mocked):
  - PENDING
  - APPROVED
  - REJECTED

### Post

- Belongs to a creator
- Gating:
  - FREE
  - SUBSCRIBER
  - PPV

### MediaAsset

- Belongs to a post
- Stores metadata:
  - `storageKey` (file/object key)
  - `mimeType`

Media bytes are not stored in DB.

### Subscription

- FAN subscribes to CREATOR
- Used to satisfy SUBSCRIBER gating

### PpvUnlock

- FAN unlocks a PPV Post
- Used to satisfy PPV gating

### LedgerEntry (critical)

- Append-only records of money-related events
- Must be auditable and never “rolled up” into a mutable balance as source-of-truth

## Entitlement logic (rules)

Given a viewer and a post:

1) FREE → viewer can see everything
2) SUBSCRIBER → viewer must have an active subscription to the creator
3) PPV → viewer must have a PPV unlock for the post

Media streaming endpoints must enforce this server-side.

## Admin controls

- Admin can disable posts or creators (soft-disable)
- Disabled content should not be visible in feed
