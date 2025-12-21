# Deploy to Google Cloud (Cloud Run + Cloud SQL)

This repo is easy to deploy on **GCP** using:

- **Cloud Run** for `apps/api` (Express) and `apps/web` (Next.js)
- **Cloud SQL for PostgreSQL** for the database

The project is a vertical slice, so this guide focuses on a practical, minimal, repeatable deployment.

## What you’ll deploy

- `fanhouse-api` (Cloud Run)
  - Listens on `$PORT` (Cloud Run supplies it)
  - Health check: `GET /health`
  - Requires environment variables: `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN` (and optional Ably)
- `fanhouse-web` (Cloud Run)
  - Next.js server (`next start`)
  - Needs `NEXT_PUBLIC_API_URL` **at build time** (it is bundled into browser JS)

## Optional: Flutter client deployment

The Flutter app in `flutter_frontend/` is a **client** (not a server). On GCP, the two practical options are:

1) **Flutter Web** hosted as static files (recommended):

- Firebase Hosting, or
- Cloud Storage static hosting + (optional) Cloud CDN

1) **Mobile (Android/iOS)** distributed via Play Store/TestFlight (not “hosted” on GCP directly)

Flutter uses `--dart-define` values:

- `API_BASE_URL` (required) — points at your deployed API (Cloud Run URL)
- `ABLY_API_KEY` (optional) — enables realtime

## Prereqs

- A GCP Project
- Billing enabled
- `gcloud` installed + authenticated
- APIs enabled:
  - Cloud Run
  - Cloud Build
  - Artifact Registry
  - Cloud SQL Admin

## 1) Create a Cloud SQL Postgres instance

Create a Postgres instance + database + user. Record:

- **Instance connection name**: `PROJECT:REGION:INSTANCE`
- DB name (e.g. `fanhouse`)
- DB user + password

### DATABASE_URL for Cloud Run + Cloud SQL

For Cloud Run’s built-in Cloud SQL connection (Unix socket), Prisma works well with a URL like:

- `postgresql://USER:PASSWORD@localhost:5432/DB?host=/cloudsql/INSTANCE_CONNECTION_NAME&schema=public`

> Tip: keep the password in a Secret Manager secret and inject it via Cloud Run env vars.

## 2) Deploy the API to Cloud Run

Build and deploy `apps/api` using the included Dockerfile:

- Dockerfile: `apps/api/Dockerfile`
- Make sure the Cloud Run service has these env vars:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `WEB_ORIGIN` (set to your deployed web URL later)
  - Optional: `ABLY_API_KEY`
  - Optional pricing: `SUBSCRIPTION_PRICE_CENTS`

Also attach the Cloud SQL instance to the API service (Cloud Run service setting: **Connections → Cloud SQL**).

### Initialize schema + seed

This repo uses Prisma. For a minimal production deploy, you can:

- Run `prisma db push`
- Run `node prisma/seed.mjs`

Recommended approach on GCP:

- Create a **Cloud Run Job** (or a one-off Cloud Build step) that runs:
  - `npm run db:deploy`
  - `npm run db:seed`

> Note: `apps/api/package.json` includes `db:deploy` and the seed is ESM (`prisma/seed.mjs`) so it can run without `tsx`.

## 3) Deploy the Web app to Cloud Run

Build and deploy `apps/web` using:

- Dockerfile: `apps/web/Dockerfile`

### Important: NEXT_PUBLIC_API_URL is baked at build-time

The web bundle reads:

- `process.env.NEXT_PUBLIC_API_URL`

That means you must provide `NEXT_PUBLIC_API_URL` during the image build.

Typical workflow:

1) Deploy **API** first → obtain its Cloud Run URL
2) Build + deploy **web** with `NEXT_PUBLIC_API_URL=<API_URL>`

## 4) Update API CORS origin

The API sets CORS from:

- `WEB_ORIGIN` (defaults to `http://localhost:3000`)

`WEB_ORIGIN` supports a comma-separated allowlist, so you can run **both** Next.js and Flutter Web against the same API, e.g.

- `WEB_ORIGIN=https://your-nextjs.example.com,https://your-flutter.example.com`

After deploying web, update the API’s `WEB_ORIGIN` to the Cloud Run web URL (or your custom domain).

## 5) Deploy Flutter Web (optional)

### Configure API URL and (optional) Ably

Flutter reads:

- `API_BASE_URL` from `const String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:4000')`
- `ABLY_API_KEY` from `const String.fromEnvironment('ABLY_API_KEY')`

So for web builds you must pass them at build time.

### Option A — Firebase Hosting (recommended)

Why: easiest HTTPS hosting, clean SPA routing, free SSL, great DX.

High-level steps:

1. Create a Firebase project (or link it to the same GCP project).
1. In `flutter_frontend/`, build web: `flutter build web --release --dart-define=API_BASE_URL=<API_URL> --dart-define=ABLY_API_KEY=<OPTIONAL>`

1. Deploy `flutter_frontend/build/web/` via Firebase Hosting.

If you use client-side routing, configure Hosting rewrites so all paths serve `index.html`.

### Option B — Cloud Storage static hosting

Why: pure GCP, simple static hosting.

High-level steps:

1. Create a GCS bucket (optionally behind a load balancer + Cloud CDN).
2. Build Flutter web (same as above).
3. Upload the contents of `flutter_frontend/build/web/` to the bucket.
4. Configure SPA routing (rewrite all paths to `index.html`) using a load balancer; GCS “website hosting” alone is limited.

For this test project (cost-first), you can also use the helper script:

- `deploy/gcp/deploy_flutter_storage.ps1`

This uploads to a public bucket and prints a simple URL like:

- `https://storage.googleapis.com/<bucket>/index.html`

If you need deep links like `/auth` and `/feed` to work directly, you’ll likely need an HTTPS load balancer rewrite (extra cost).

## Notes / production considerations

- **Uploads**: `apps/api/uploads/` is local filesystem storage. Cloud Run filesystems are ephemeral.
  - For production, move uploads to **Cloud Storage** and store the `storageKey` as a GCS object path.
- **Secrets**: prefer Secret Manager for `JWT_SECRET`, DB password, Ably key.
- **Networking**: if you want private API access from web, use an HTTPS Load Balancer + serverless NEG; otherwise, public API is fine (JWT protects protected routes).

## Cost minimization (best for a test project)

The biggest cost driver is usually **Cloud SQL** (it does *not* scale to zero). For lowest cost:

- Prefer **Cloud Run** for API + Next.js:
  - Keep **min instances = 0** (scales to zero)
  - Set **max instances = 1** to avoid surprise scaling
  - Use small sizing like **1 vCPU / 512Mi** (bump if you hit OOM)
- For **Cloud SQL**:
  - Choose the **smallest non-HA (zonal) instance** available in your region
  - Avoid high availability, replicas, and large backups for a demo
  - When you’re not using the project, **stop the Cloud SQL instance** (you still pay storage, but compute stops)

For Flutter Web hosting, Firebase Hosting is typically the cheapest + simplest option for HTTPS and SPA routing.

## Suggested values to collect from you (so I can tailor commands exactly)

If you paste these, I can generate exact `gcloud` deploy commands that match your project:

- `GCP_PROJECT_ID`
- `REGION` (e.g. `us-central1`)
- Cloud SQL `INSTANCE_CONNECTION_NAME`
- Desired Cloud Run service names (or accept defaults)
- Whether you want a custom domain (yes/no)

For Flutter web hosting, also tell me:

- Hosting preference: Firebase Hosting or Cloud Storage
- Whether you want SPA routing for deep links (usually yes)

## Optional: automated deploy scripts

If you want a more repeatable workflow, this repo includes GCP deployment helpers:

- Cloud Build configs (API + web): `deploy/gcp/cloudbuild.*.yaml`
- PowerShell deploy script templates: `deploy/gcp/deploy.ps1` + `deploy/gcp/vars.example.ps1`
