# FanHouse Test Project - Complete Plan

## Overview

This is a focused vertical slice of FanHouse demonstrating:

- Authentication with JWT + roles (Fan, Creator, Admin)
- Creator onboarding with approval workflow
- Content gating (FREE, SUBSCRIBER, PPV)
- Mock payments with append-only ledger
- Realtime updates via Ably
- Admin control panel

---

## ✅ Completed Features

### Backend (API - Express + TypeScript + Prisma)

| Feature | Status | Files |
|---------|--------|-------|
| Database schema | ✅ Done | `apps/api/prisma/schema.prisma` |
| Auth (register/login/me) | ✅ Done | `apps/api/src/routes/auth.ts` |
| Creator onboarding | ✅ Done | `apps/api/src/routes/creator.ts` |
| Posts CRUD with gating | ✅ Done | `apps/api/src/routes/posts.ts` |
| Billing (subscribe/unlock) | ✅ Done | `apps/api/src/routes/billing.ts` |
| Admin actions | ✅ Done | `apps/api/src/routes/admin.ts` |
| Media serving with entitlements | ✅ Done | `apps/api/src/routes/media.ts` |
| Notifications (Knock-style) | ✅ Done | `apps/api/src/routes/notifications.ts` |
| Ledger service | ✅ Done | `apps/api/src/services/ledger.ts` |
| Ably realtime publishing | ✅ Done | `apps/api/src/services/ably.ts` |
| Auth middleware | ✅ Done | `apps/api/src/middleware/auth.ts` |
| Seed data | ✅ Done | `apps/api/prisma/seed.ts` |

### Frontend (Web - Next.js App Router)

| Feature | Status | Files |
|---------|--------|-------|
| Landing page | ✅ Done | `apps/web/src/app/page.tsx` |
| Auth provider | ✅ Done | `apps/web/src/components/auth-provider.tsx` |
| Navigation | ✅ Done | `apps/web/src/components/nav.tsx` |
| Feed page with gating | ✅ Done | `apps/web/src/app/feed/page.tsx` |
| Creator hub | ✅ Done | `apps/web/src/app/creator/page.tsx` |
| Admin console | ✅ Done | `apps/web/src/app/admin/page.tsx` |
| UI components (shadcn-style) | ✅ Done | `apps/web/src/components/ui/` |
| Realtime subscription | ✅ Done | `apps/web/src/lib/realtime.ts` |
| API client | ✅ Done | `apps/web/src/lib/api.ts` |

### Infrastructure

| Feature | Status | Files |
|---------|--------|-------|
| Docker Compose (Postgres) | ✅ Done | `docker-compose.yml` |
| Environment templates | ✅ Done | `.env.example`, `.env.local.example` |

---

## 📋 TODO: Testing

### API Tests (Priority: High)

#### 1. Auth Tests (`apps/api/__tests__/auth.test.ts`)

- [ ] Register new user (FAN role)
- [ ] Register new creator (CREATOR role + pending profile)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (401)
- [ ] Get /auth/me with valid token
- [ ] Get /auth/me with invalid token (401)

#### 2. Posts Gating Tests (`apps/api/__tests__/posts.test.ts`)

- [ ] FREE posts visible to unauthenticated users
- [ ] FREE posts include media for everyone
- [ ] SUBSCRIBER posts body visible, media hidden for non-subscribers
- [ ] SUBSCRIBER posts fully visible after subscription
- [ ] PPV posts body visible, media hidden for non-purchasers
- [ ] PPV posts fully visible after unlock
- [ ] Disabled posts not returned
- [ ] Disabled creator posts not returned

#### 3. Billing Tests (`apps/api/__tests__/billing.test.ts`)

- [ ] Subscribe creates subscription record
- [ ] Subscribe creates ledger entry
- [ ] Subscribe sends notification to creator
- [ ] Re-subscribe reactivates existing subscription
- [ ] Unlock PPV creates unlock record
- [ ] Unlock PPV creates ledger entry
- [ ] Unlock non-PPV post returns error

#### 4. Admin Tests (`apps/api/__tests__/admin.test.ts`)

- [ ] Non-admin cannot access admin routes
- [ ] Approve creator changes status
- [ ] Reject creator changes status
- [ ] Disable creator hides their posts
- [ ] Disable post removes from feed
- [ ] Transactions endpoint returns ledger entries

---

## 🔧 TODO: Development Tasks

### Test Infrastructure Setup

- [ ] Add vitest to API `package.json`
- [ ] Create `apps/api/vitest.config.ts`
- [ ] Create `apps/api/__tests__/setup.ts` with Prisma mock
- [ ] Create `apps/api/__tests__/helpers.ts` with test utilities

### VS Code Tasks

- [x] Create `.vscode/tasks.json` with:
  - Start Postgres (docker-compose up)
  - API dev server
  - Web dev server
  - Run API tests
  - Database push/seed
  - Full Setup compound task
  - Full Dev compound task

---

## 🚀 Future Improvements (Out of Scope)

Per the README tradeoffs:

- [ ] Replace mock payments with CCBill integration
- [ ] Replace local media storage with object storage + signed URLs
- [ ] Replace Knock-style notifications with actual Knock SDK
- [ ] Add E2E tests with Playwright

---

## Quick Commands

```bash
# Start Postgres
docker compose up -d

# API setup & dev
cd apps/api
npm install
npm run db:push
npm run db:seed
npm run dev

# Web setup & dev
cd apps/web
npm install
npm run dev

# Run tests (after setup)
cd apps/api
npm test
```

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | <admin@fanhouse.test> | admin123 |
| Fan | <fan@fanhouse.test> | fan123 |
| Creator | <creator@fanhouse.test> | creator123 |

---

## Architecture Decisions

1. **JWT over sessions**: Simpler for API-first design, no session store needed
2. **Prisma over raw SQL**: Type-safe queries, easy migrations, good DX
3. **Append-only ledger**: Financial data never deleted, always auditable
4. **Local file storage**: Demo simplicity; production would use S3/GCS
5. **Postgres over NoSQL**: Strong relational model, ACID for financial data
6. **shadcn/ui patterns**: Copy-paste components, full control, no vendor lock-in
7. **MVVM Architecture**: Clean separation of concerns in frontend

---

## 🏗️ MVVM Architecture (Frontend)

The web app follows **Model-View-ViewModel** pattern for clean separation of concerns:

```
apps/web/src/
├── models/           # DATA LAYER
│   ├── types.ts      # Domain entities & DTOs
│   ├── api.ts        # API client functions
│   └── index.ts      # Barrel export
│
├── viewmodels/       # BUSINESS LOGIC LAYER
│   ├── useAuth.tsx   # Auth state & operations
│   ├── usePosts.ts   # Feed state & billing actions
│   ├── useAdmin.ts   # Admin console state
│   ├── useCreator.ts # Creator onboarding & post creation
│   └── index.ts      # Barrel export
│
├── app/              # VIEW LAYER (Pages)
│   ├── page.tsx      # Landing (pure presentational)
│   ├── feed/         # Feed view (consumes usePosts)
│   ├── admin/        # Admin view (consumes useAdmin)
│   ├── creator/      # Creator view (consumes useCreator)
│   └── auth/         # Auth forms
│
└── components/       # REUSABLE UI
    ├── ui/           # shadcn-style primitives
    └── nav.tsx       # Navigation bar
```

### Layer Responsibilities

| Layer | Responsibility | State? | Side Effects? |
|-------|---------------|--------|---------------|
| **Models** | Types, API calls, data transformation | No | Yes (fetch) |
| **ViewModels** | State management, business logic, computed properties | Yes | Yes |
| **Views** | Rendering, user interaction, layout | No (via VM) | No |

### ViewModel Pattern

Each ViewModel hook exposes:

- **State**: Current data (posts, user, loading, error, message)
- **Commands**: Actions to mutate state (login, subscribe, createPost)
- **Computed**: Derived values (isAuthenticated, canPost, pendingCreators)

```typescript
// Example: usePosts ViewModel
interface PostsViewModel {
  // State
  posts: Post[];
  loading: boolean;
  error: string | null;

  // Commands
  fetchPosts: () => Promise<void>;
  subscribe: (creatorId: string) => Promise<void>;
  unlockPpv: (postId: string) => Promise<void>;

  // Helpers
  getMediaUrl: (assetId: string) => string;
}
```

### Benefits

1. **Testability**: ViewModels can be unit tested without UI
2. **Reusability**: Same ViewModel can power multiple views
3. **Maintainability**: Clear boundaries between layers
4. **Type Safety**: Strong typing throughout the stack
