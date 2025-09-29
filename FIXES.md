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
  short: "Missing or incorrect import for Switch component"
  details: |
    TypeScript build fails with TS2307:
      • Cannot find module '@colanode/ui/components/ui/switch'
    Affected files:
      • sidebar-admin.tsx
      • workspace-api-tokens-tab.tsx

    Requirements:
      • Verify if a Switch component exists in packages/ui/components/ui/.
      • If missing, create new Switch component (can reuse shadcn/ui switch).
      • If present under different path, update imports to correct location.
      • Ensure consistent import path across all UI components.
