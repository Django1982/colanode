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

