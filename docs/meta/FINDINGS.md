# Project Architecture & Findings

## Monorepo Overview
- Managed by npm workspaces + Turborepo; packages shared across server, web, desktop, and auxiliary scripts (`package.json`, `turbo.json`).
- Source split into `apps/` (runnable targets), `packages/` (shared libraries), `hosting/` (deployment manifests), `assets/` (marketing/media), and `scripts/` (workspace utilities).

## Backend (`apps/server`)
- Fastify application bootstrapped in `apps/server/src/index.ts`, wiring migrations (`data/database.ts`), Redis connections, BullMQ queues, CRDT synchronizers, and email dispatch before exposing HTTP/WebSocket listeners.
- `api/` layers provide REST + WebSocket endpoints. Plugins add auth context, IP-based rate limiting, account/workspace guards, CORS, and unified error handling. Routes are grouped by domain (accounts, avatars, sockets, workspaces/files, storage, users).
- Public REST endpoints now live under `/rest/v1`, secured by per-user/workspace API tokens with optional write scopes and backed by audit logging (`apps/server/src/api/rest`, `apps/server/src/lib/api-tokens.ts`).
- Persistence handled through Kysely targeting Postgres with pgvector; schema models cover accounts, workspaces, nodes, CRDT updates, reactions, collaborations, job tracking, and audit tables (`data/schema.ts`). Migrations live in `data/migrations`.
- Storage abstraction (`data/storage.ts`) wraps S3-compatible drivers and enforces workspace quotas; Redis layer (`data/redis.ts`) powers caching, rate-limits, and queue coordination.
- Background jobs under `jobs/` (BullMQ) cover AI embedding generation, document/node merge pipelines, workspace cleanup, TUS upload eviction, and transactional emails. AI helpers in `lib/ai/` integrate LangChain + vector retrieval against pgvector indices.
- Domain libraries (`lib/`) encapsulate business logic: account provisioning, workspace membership, node hierarchies, collaboration tracking, CRDT synchronizers, OTP/tokens, tus upload handling, and event bus notifications.

## Shared Packages
- `@colanode/core`: canonical domain types/enums, Zod schemas, fractional indexing utilities, permission helpers, text/mention formatting, and registry metadata consumed across apps.
- `@colanode/crdt`: Yjs-powered utilities for encoding/merging document updates, schema-driven object editing, undo/redo management, and patch diffing for audit/debugging.
- `@colanode/client`: local-first application runtime. Provides SQLite-backed repositories, sync handlers, Kysely migrations, query/mutation mediators, websocket transport, tus upload helpers, and TipTap editor glue.
- `@colanode/ui`: React 19 component suite built with Tailwind + Radix primitives, TanStack Query bindings, tiptap editor surface, command palette, and workspace-specific widgets.

## Frontend Clients
- **Web (`apps/web`)**: Vite + React SPA bootstrapped via `src/main.tsx`. Runs the client runtime inside an OPFS-backed dedicated web worker (Comlink bridge) for offline-first sync, broadcasting events across tabs via `BroadcastChannel`. Detects unsupported browsers/mobile and falls back to static messaging. Service layers implement web-specific filesystem, path, and SQLite (WASM) adapters.
- **Desktop (`apps/desktop`)**: Electron Forge app using Vite for renderer bundling. Main process handles lifecycle, auto updates, deep linking, and tray integration (`src/main/`). Renderer reuses the React UI from `@colanode/ui`; preload exposes IPC bridge for filesystem dialogs, OS integrations, and better-sqlite3 persistence.

## Deployment & Tooling
- Docker Compose templates (`hosting/docker`) provision server + dependencies (Postgres with pgvector, Redis/Valkey, MinIO, maildev). Helm charts under `hosting/kubernetes` align with the same env contract.
- Scripts workspace hosts post-install automation (`scripts/src/postinstall`) and development helpers. Vitest workspace config enables shared testing across packages (`vitest.workspace.ts`).

These observations give us a cohesive picture of how realtime collaboration, local-first storage, and AI augmentation stitch together across the stack.
