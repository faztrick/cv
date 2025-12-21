# Deploy everything on a single Ubuntu VM (fast + simple)

This deploy uses Docker Compose on one VM:

- Postgres (container)
- API (container)
- Next.js web (container)
- Nginx (container) as a reverse proxy and (optionally) static hosting for Flutter Web

It also mounts a VM folder for uploads so files persist.

## Prereqs on the VM

- Docker + Docker Compose
- Git

## 1) Get the code onto the VM

Clone (or pull) your repo onto the VM.

## 2) Create env file

From repo root:

- Copy the template:
  - `cp deploy/vm/env.vm.example .env.vm`
- Edit `.env.vm`:
  - Replace `<VM_IP_OR_DOMAIN>`
  - Change `JWT_SECRET`

## 3) Start the stack

From repo root:

- `docker compose --env-file ./.env.vm -f docker-compose.vm.yml up -d --build`

## 4) Initialize DB (schema + seed)

Run once:

- `docker compose --env-file ./.env.vm -f docker-compose.vm.yml --profile init run --rm db-init`

## 5) Verify

- Web: `http://<VM_IP_OR_DOMAIN>/`
- API health: `http://<VM_IP_OR_DOMAIN>/api/health`

## Upload persistence

Uploads are stored on the VM filesystem at:

- `./vm_data/uploads` (relative to repo root)

Back this up if you care about the files.

## Optional: host Flutter Web on the same VM

1) Build Flutter Web so it works under a sub-path:

- `flutter build web --release --base-href /flutter/ --dart-define=API_BASE_URL=http://<VM_IP_OR_DOMAIN>/api`

1) Copy build output into:

- `./vm_data/flutter-web`

1) Restart nginx (or the whole stack):

- `docker compose --env-file ./.env.vm -f docker-compose.vm.yml restart nginx`

Then open:

- `http://<VM_IP_OR_DOMAIN>/flutter/`

Note: deep links like `/flutter/auth` should work because nginx rewrites missing paths to `index.html`.
