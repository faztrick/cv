# Deployment — Single Ubuntu VM (Docker Compose)

This is the simplest “it runs” deployment and is ideal for a fast submission.

Use:

- `docker-compose.vm.yml`
- `.env.vm` (copy from `deploy/vm/env.vm.example`)

## Summary

1) Copy env template:

- `cp deploy/vm/env.vm.example .env.vm`

1) Edit `.env.vm`:

- set `JWT_SECRET`
- set `WEB_ORIGIN` to your VM URL
- set `NEXT_PUBLIC_API_URL` to your VM URL `/api`

1) Start stack:

- `docker compose --env-file ./.env.vm -f docker-compose.vm.yml up -d --build`

1) Initialize DB:

- `docker compose --env-file ./.env.vm -f docker-compose.vm.yml --profile init run --rm db-init`

1) Verify:

- Web: `http://<VM>/`
- API: `http://<VM>/api/health`

Uploads persist at:

- `./vm_data/uploads`

For full details see: `deploy/vm/README.md`
