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
  status: in-progress
  short: "Unify Admin Settings with Settings Drawer UX"
  details: |
    Human tests show Admin Settings (Accounts, Workspaces, Audit Logs) currently open
    as standalone views in the admin nav bar.  
    Expected behavior: open inside the same right-hand settings drawer/panel used by
    Workspace Settings and Appearance.  
    Requirements:
      • Add "Admin" section in settings sidebar.
      • On click, open drawer with Accounts, Workspaces, Audit Logs as subsections.
      • Ensure same close button and panel UX as other settings.
    2025-09-28 - Drawer path wired; awaiting human UX verification of new flow.
