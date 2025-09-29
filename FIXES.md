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
  status: done
  short: "Missing dependency @radix-ui/react-switch"
  details: |
    TypeScript build fails with TS2307:
      • Cannot find module '@radix-ui/react-switch'
    Affected file:
      • packages/ui/src/components/ui/switch.tsx

    Requirements:
      • Verify if @radix-ui/react-switch is installed in packages/ui/package.json.
      • If missing, add @radix-ui/react-switch as a dependency.
      • Ensure type declarations are available (install @types/react if required).
      • Update imports in switch.tsx to match Radix component structure.

- priority: 1
  source: ai
  status: done
  short: "Documented API paths omit /client/v1 prefix"
  details: |
    apps/server/src/api/index.ts:7 registers clientRoutes under `${prefix}/client/v1` (prefix defaults to config.server.pathPrefix or empty).
    apps/server/src/api/client/routes/index.ts:9 mounts Accounts/Workspaces/Admin beneath that namespace.
    docs/API_ENDPOINTS.md and scripts/api_tests.sh target `/accounts/...` without the required `/client/v1` (and optional config prefix), leading to 404s in the running server.
    Decide whether to expose routes at documented paths or update documentation/tests to match actual Fastify registration.
    Resolved 2025-09-29 by updating docs/API_ENDPOINTS.md and scripts/api_tests.sh to /client/v1.

