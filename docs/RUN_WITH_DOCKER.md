# Run Colanode With Docker

This repo ships two Compose setups:

- `hosting/docker/docker-compose.yaml` — standard stack using the published `ghcr.io/colanode` images and shared resource limits.
- `hosting/docker/docker-compose-local.yaml` — standalone stack that expects a custom `django01/colanode:local` image and applies the same resource/security settings.

Follow the steps below depending on how you want to deploy.

---

## 1. Common Preparation

1. Copy the default environment template and fill in the secret variables at the top (`POSTGRES_*`, `REDIS_PASSWORD`, `STORAGE_S3_*`, `SMTP_EMAIL_FROM`, etc.):
   ```bash
   cd hosting/docker
   cp defaults.env.example defaults.env
   ```
   Adjust values as needed (database credentials, S3 access keys, REST token expiries, etc.).

2. Ensure Docker and Docker Compose are installed and running.

---

## 2. Using Published Images

1. From `hosting/docker`, start the stack:
   ```bash
   docker compose --env-file defaults.env up -d
   ```
2. The server runs on `http://localhost:3000`. Web preview (if using the bundled web image) is available at `http://localhost:4000`.
3. Stop the stack:
   ```bash
   docker compose down
   ```

---

## 3. Using Local Server & Web Images

1. Build both images at the repository root:
   ```bash
   docker build -f apps/server/Dockerfile -t django01/colanode:local .
   docker build -f apps/web/Dockerfile -t django01/colanode-web:local .
   ```

2. Switch to the Docker directory and launch with the local compose file (which now references the local images for both server and web):
   ```bash
   cd hosting/docker
   docker compose -f docker-compose-local.yaml --env-file defaults.env up -d
   ```

3. The stack uses the same ports and dependencies as the default compose file; both server (`django01/colanode:local`) and web (`django01/colanode-web:local`) images come from your local build.

4. Stop the stack:
   ```bash
   docker compose -f docker-compose-local.yaml down
   ```

---

## 4. Notes

- The server container runs database migrations on start; the new REST API tables (`api_tokens`, `audit_logs`) are created automatically.
- `defaults.env.example` already includes the REST token expiry defaults (`API_TOKEN_DEFAULT_EXPIRY_DAYS`, `API_TOKEN_MAX_EXPIRY_DAYS`). Override them in `defaults.env` if needed.
- For production, supply strong secrets (Postgres, Redis, Minio, API tokens) and consider mounting persistent volumes/backups.
