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
  source: human
  status: done
  short: "Password reset mail test blocked (mail server missing)"
  details: "Dev outbox writes OTP mail to tmp/emails/ when SMTP disabled."

- priority: 1
  source: human
  status: open
  short: "API token creation missing in Workspace UI"
  details: "Human test 20250925 → REST tests blocked"

- priority: 1
  source: ai
  status: open
  short: "Admin settings sidebar restructure pending UX review"
  details: "Accounts, Workspaces, Audit Logs relocated from top nav to Admin Settings mid sidebar."

- priority: 2
  source: human
  status: open
  short: "Audit logs only visible in DB"
  details: "Add UI + file logs (/var/logs/colanode/audit.log)"

- priority: 2
  source: ai
  status: done
  short: "Lint script missing for @colanode/web"
  details: "Lint passes; import ordering fixed and pipeline verified."

- priority: 3
  source: human
  status: done
  short: "Redis failure handling in /health"
  details: "Optional redis health flag avoids 503 when cache offline."
