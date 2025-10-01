# FIXES.md – Open Issues and Suggestions

## Format
- priority: 1 (high), 2 (medium), 3 (low)
- source: ai | human
- status: open | in-progress | done
- short: one-line explanation
- details: optional context or file refs

---

## Current

- priority: 1
  source: compile
  status: open
  short: "Logging hooks in app.ts use invalid Fastify types"
  details: |
    Compile fails in apps/server/src/app.ts:
      • TS2352: Invalid cast of FastifyRequest/Reply to Record<symbol, unknown>
      • TS2339: Property 'getResponseTime' does not exist on FastifyReply
      • TS2339: Property 'routerPath' does not exist on FastifyRequest

    Requirements:
      • Replace unsafe casts with safe typing (cast via unknown if needed).
      • Use valid Fastify methods for response timing (e.g. reply.elapsedTime or plugin).
      • Log route path via request.url or routeOptions if routerPath is unavailable.
      • Ensure type-safe logging for method, path, status, duration.


- priority: 1
  source: ai
  status: open
  short: "Device token issuance not yet validated end-to-end"
  details: |
    Local issuance flow implemented; remote verification blocked because provided cna_ sample returns token_invalid.
    Need a valid workspace API token to mint fresh cnd_ device token and confirm GET /client/v1/workspaces succeeds.

- priority: 1
  source: ai
  status: open
  short: "Device token issuance failing for workspace token"
  details: |
    POST /client/v1/auth/device-tokens now returns {"code":"unknown","message":"An unexpected error occurred."}
    Request used cna_01k6a8sexdnp7t39jh0fa5r2ntat42ba7b9914d04467924896b8ccf72d38918df196ab134b26a4e88b39b4362c41 with body {"scopes":["read_only"],"type":"web","platform":"linux","version":"dev"}.
    Need server-side investigation to restore workspace-token-to-device-token issuance before client GETs can be validated.
    
- priority: 2
  source: infra
  status: open
  short: "Proxy may strip JSON bodies on POST"
  details: |
    Nginx Proxy Manager force-ssl or proxy.conf may redirect/drop JSON payloads on POST.
    Current workaround: Fastify parser patched to treat empty body as {}.
    Long-term: review proxy.conf and force-ssl.conf to ensure POST redirects use 307/308,
    and verify proxy_request_buffering / transfer-encoding behavior.

- priority: 2
  source: code
  status: open
  short: "Body type coercion for tolerant JSON parsing brittle"
  details: |
    Quick-fix introduced stricter type errors (TS2339, TS2345) because Fastify body can be Buffer or string.
    Added explicit coercion to string before trim/parse and ensured .includes only called on arrays.
    If further errors occur, need to centralize body parsing in a helper to normalize Buffer|string → string,
    and validate body.scopes shape before usage.

- priority: 1
  source: ai
  status: open
  short: "Login endpoint fails while logout succeeds"
  details: |
    Observed: /client/v1/accounts/emails/logout works correctly, but /client/v1/accounts/emails/login returns error (401 or 500).
    Findings: handler uses email/password schema (apps/server/src/api/client/routes/accounts/email-login.ts:24; packages/core/src/types/accounts.ts:53) and argon2 verification (apps/server/src/lib/accounts.ts:55). Route mounts under /client/v1/accounts/emails/login via accounts/index.ts:21, routes/index.ts:13, api/index.ts:15.
    Suspect: buildLoginSuccessOutput device insert (apps/server/src/lib/accounts.ts:86) fails if devices.scopes migration absent or insert errors. Need DB verification and logs from failing environment.
