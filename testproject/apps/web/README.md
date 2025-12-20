# FanHouse Test Project — Web (Next.js)

This folder contains the web UI for the FanHouse engineering test vertical slice.

For the full setup instructions (Postgres + API + Web), demo accounts, and architecture notes, see the repo root `README.md`.

## Local dev (web only)

1) Create env file:

- Copy `apps/web/.env.local.example` to `apps/web/.env.local`

1) Install deps + run:

- `npm install`
- `npm run dev`

Then open <http://localhost:3000>.

## Notes

- The UI is built with Next.js App Router + TypeScript + Tailwind.
- Realtime updates use Ably if `NEXT_PUBLIC_ABLY_KEY` is set; otherwise the app runs without realtime.
