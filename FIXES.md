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

