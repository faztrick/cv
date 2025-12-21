# Flutter Web on GCP

The Flutter app in `flutter_frontend/` can be deployed as a **static web site**.

It is configured via `--dart-define` build-time values:

- `API_BASE_URL` (required) — your deployed API base URL (Cloud Run)
- `ABLY_API_KEY` (optional) — enable realtime

The code paths:

- `API_BASE_URL`: `flutter_frontend/lib/app/config/app_config.dart`
- `ABLY_API_KEY`: `flutter_frontend/lib/app/services/realtime_service.dart`

## Build

From `flutter_frontend/`:

- Release build:
  - `flutter build web --release --dart-define=API_BASE_URL=<API_URL>`
- With realtime:
  - `flutter build web --release --dart-define=API_BASE_URL=<API_URL> --dart-define=ABLY_API_KEY=<ABLY_KEY>`

Output directory:

- `flutter_frontend/build/web/`

## Host Option A: Firebase Hosting (recommended)

Reasons:

- HTTPS + free SSL
- Very good SPA routing support for deep links
- Simple deploy workflow

Configure Hosting rewrites so all paths serve `index.html` (SPA-style).

## Host Option B: Cloud Storage + Load Balancer

You can upload `build/web/` to a GCS bucket, but to support deep links (e.g. `/auth`, `/feed`) you generally want a load balancer that rewrites 404s to `index.html`.

This option is best when you already have a global HTTPS load balancer and want Cloud CDN in front.

## CORS / API notes

Flutter Web runs in a browser, so CORS applies.

Your API uses `WEB_ORIGIN` for CORS. If you deploy Flutter Web, set:

- `WEB_ORIGIN = https://<your flutter site domain>`

If you also deploy the Next.js frontend, use a comma-separated allowlist, for example:

- `WEB_ORIGIN=https://your-nextjs.example.com,https://your-flutter.example.com`

If you also deploy Next.js web, you’ll need to decide whether:

- you only support one origin, or
- you extend the API CORS middleware to allow a list of origins.
