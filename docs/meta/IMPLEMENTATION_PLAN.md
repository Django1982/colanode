# Feature Implementation Plan

## Phase 1 – API & Access Foundations ✅
- Implemented REST surface under `/rest/v1` covering workspaces, documents, files, and users secured by API tokens (`apps/server/src/api/rest`).
- Added per-user/workspace API tokens with workspace toggles, scope enforcement, and rotation (`apps/server/src/lib/api-tokens.ts`) plus audit logging (`apps/server/src/lib/audit-logs.ts`).
- Updated server bootstrap/config (`apps/server/src/api/index.ts`, `apps/server/src/lib/config/api.ts`) and migrations/schema to persist tokens and logs (`apps/server/src/data/migrations/00032-add-api-tokens-and-audit-logs.ts`, `apps/server/src/data/schema.ts`).
- Refreshed Docker defaults and documentation to surface new env knobs (`hosting/docker/docker-compose.yaml`, `hosting/docker/defaults.env.example`, `docs/meta/SECURITY.md`, `docs/meta/FINDINGS.md`).

## Phase 2 – Account & Workspace Management
Status: In progress (core API + UI shipped; follow-up automation/tests outstanding)
- ✅ Introduced a global `Server Administrator` role with first-user auto-promotion, admin-only elevation flows, and request-time enforcement in `adminAuthenticator`.
- ✅ Added self-service password rotation with strength validation, audit logging, and confirmation email via `/v1/accounts/password` + `AccountPasswordRotate`.
- ✅ Implemented workspace removal as a soft delete, with user revocation, scheduled `workspace.clean` purges, and admin restore/purge controls.
- ✅ Built an administrator console in the web app that surfaces account/workspace management, role edits, status toggles, and password-reset triggers for administrators only.
- 🔄 Hardened identity management: admin actions now emit audit logs, nightly cleanup honors `LOGGING_AUDIT_RETENTION_DAYS`, `/health` exposes readiness, and existing device rate limits guard the surface; still need automated coverage once Node ≥20 tooling is available.

## Phase 3 – Integrations & Collaboration Enhancements
Priorities:
1.
- Leverage the new REST API to expose endpoints tailored for the Discord bot (workspace events, message posting, lightweight slash commands).
2. 
- Surface sync health dashboards by aggregating metrics from Redis/BullMQ queues and presenting them in the admin console.
3.
- Provide migration scripts and UI affordances in the admin tooling to manage template life cycles.
4.
- Implement the Discord bot service with outbound webhooks and inbound command handling, enforcing workspace-level permissions.
explain:
- Add workspace templates managed through `@colanode/core` registries so admins can seed page/database structures when provisioning workspaces.

## Phase 4 – Observability & Intelligence
- Deliver unified search spanning local SQLite caches and server Postgres indices, using existing CRDT metadata and vector search for documents.
- Surface sync health dashboards by aggregating metrics from Redis/BullMQ queues and presenting them in the admin console.
- Iterate on AI-powered assistants once dashboards expose data quality signals, tying into existing LangChain pipelines (`apps/server/src/lib/ai`).
- Document operating procedures, add end-to-end tests, and monitor performance before general release.

## Maintenance Backlog
- Replace deprecated npm dependencies highlighted in `docs/NPM_WARNINGS.md` (e.g. `rimraf@3`, `glob@7`, `eslint@8`, `inflight@1`, `sourcemap-codec@1`) with supported alternatives or upgraded versions to keep future Docker builds warning-free.
- Add a lightweight `/health` Fastify route so external monitors (and local scripts) can probe server readiness without relying on `/config`.
