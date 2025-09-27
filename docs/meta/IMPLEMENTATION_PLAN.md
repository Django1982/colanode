# Feature Implementation Plan

## Phase 1 – API & Access Foundations ✅
- Implemented REST surface under `/rest/v1` covering workspaces, documents, files, and users secured by API tokens (`apps/server/src/api/rest`).
- Added per-user/workspace API tokens with workspace toggles, scope enforcement, and rotation (`apps/server/src/lib/api-tokens.ts`) plus audit logging (`apps/server/src/lib/audit-logs.ts`).
- Updated server bootstrap/config (`apps/server/src/api/index.ts`, `apps/server/src/lib/config/api.ts`) and migrations/schema to persist tokens and logs (`apps/server/src/data/migrations/00032-add-api-tokens-and-audit-logs.ts`, `apps/server/src/data/schema.ts`).
- Refreshed Docker defaults and documentation to surface new env knobs (`hosting/docker/docker-compose.yaml`, `hosting/docker/defaults.env.example`, `docs/meta/SECURITY.md`, `docs/meta/FINDINGS.md`).

## Phase 2 – Account & Workspace Management
- Introduce a global `Server Administrator` role, auto-assigned to the first registered account and ranked above workspace `Owner`; expose admin-only permissions checks across API and UI.
- Allow end users to rotate their own passwords from the client apps, wiring through existing auth plugins and email confirmations.
- Implement full workspace removal workflows that revoke access, clean CRDT state, and queue background cleanup jobs.
- Build an administration console (web) for server operators: account activation, password reset, email update, and user summaries sourced from Kysely queries.
- Harden identity management by ensuring admin actions are audited and rate-limited via the existing event bus and Redis stores.

## Phase 3 – Integrations & Collaboration Enhancements
- Leverage the new REST API to expose endpoints tailored for the Discord bot (workspace events, message posting, lightweight slash commands).
- Implement the Discord bot service with outbound webhooks and inbound command handling, enforcing workspace-level permissions.
- Add workspace templates managed through `@colanode/core` registries so admins can seed page/database structures when provisioning workspaces.
- Provide migration scripts and UI affordances in the admin tooling to manage template life cycles.

## Phase 4 – Observability & Intelligence
- Deliver unified search spanning local SQLite caches and server Postgres indices, using existing CRDT metadata and vector search for documents.
- Surface sync health dashboards by aggregating metrics from Redis/BullMQ queues and presenting them in the admin console.
- Iterate on AI-powered assistants once dashboards expose data quality signals, tying into existing LangChain pipelines (`apps/server/src/lib/ai`).
- Document operating procedures, add end-to-end tests, and monitor performance before general release.

## Maintenance Backlog
- Replace deprecated npm dependencies highlighted in `docs/NPM_WARNINGS.md` (e.g. `rimraf@3`, `glob@7`, `eslint@8`, `inflight@1`, `sourcemap-codec@1`) with supported alternatives or upgraded versions to keep future Docker builds warning-free.
