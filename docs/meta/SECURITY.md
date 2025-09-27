# Security Notes

- `.env` secrets are loaded at startup (`apps/server/src/index.ts:1`); keep runtime configs out of VCS and prefer secrets managers for deployments.
- Authentication relies on device tokens parsed/verified per request with rate limiting (`apps/server/src/api/client/plugins/account-auth.ts:1`, `apps/server/src/lib/tokens.ts`). Confirm signing keys rotate and expired/disabled devices are pruned from Postgres.
- External REST access is mediated through per-user/workspace API tokens hashed in Postgres with rotation windows and audit trails (`apps/server/src/lib/api-tokens.ts`, `apps/server/src/lib/audit-logs.ts`); keep write scopes limited, expire unused tokens, and monitor audit logs for anomalies.
- IP throttling hooks exist but require correct proxy headers; ensure trusted proxy chain is enforced when running behind load balancers (`apps/server/src/api/client/plugins/auth-ip-rate-limit.ts`).
- File uploads stream through TUS and S3-compatible backends (`apps/server/src/lib/tus`). Validate bucket policies, enforce antivirus scanning, and restrict public ACLs.
- AI integrations call out to LangChain/OpenAI/Gemini providers (`apps/server/src/lib/ai/llms.ts`). Lock down API keys, monitor usage, and review data handling policies before enabling in regulated environments.
- Background jobs execute merges and cleanup across workspaces (`apps/server/src/jobs`). Deploy BullMQ dashboards/alerts to catch stuck workers; jobs may delete data—tie actions to audit logging.
- Web client requires OPFS for local persistence (`apps/web/src/main.tsx`); provide fallbacks or explicit messaging for untrusted browsers and ensure service workers don’t expose cached sensitive data.
- Desktop app bundles better-sqlite3 storage (`apps/desktop/src/main`). Ship auto-update artifacts over HTTPS and sign binaries; review preload IPC surface to avoid remote code execution.
- Docker build surfaced several deprecated npm packages (see `NPM_WARNINGS.md`); plan dependency upgrades so future images ship without unmaintained libraries like `rimraf@3`, `glob@7`, or `inflight@1.0.6`.
