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

