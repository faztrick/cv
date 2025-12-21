# Deployment — GCP (Cloud Run + Cloud SQL)

This repo supports deployment to GCP using:

- Cloud Run (API + Web)
- Cloud SQL (Postgres)

Primary guide:

- `deploy/gcp/README.md`

## Critical detail: NEXT_PUBLIC_API_URL is build-time

The Next.js web bundle reads `NEXT_PUBLIC_API_URL` in browser code, so it must be supplied **at image build time**.

Practical workflow:

1) Deploy API → obtain API Cloud Run URL
2) Build web image with `--build-arg NEXT_PUBLIC_API_URL=<API_URL>`
3) Deploy web
4) Update API `WEB_ORIGIN` to include the web URL

## DB init

Schema + seed should be run as a one-off job:

- `npm run db:deploy`
- `npm run db:seed`

A Cloud Run Job is a good fit.

## Uploads

Cloud Run filesystem is ephemeral.
For production-like behavior, use object storage (GCS) for uploads.
