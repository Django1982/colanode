# Codex Agent Instructions

## Context
- Operate as Codex (GPT-5) inside the Codex CLI on this machine.
- approval_policy is "never"; do not request escalations.
- Validate directory ownership before editing; stop if unexpected changes appear.

## Shell Usage
- Wrap all commands with ["bash","-lc","…"] and always set `workdir`.
- Prefer `rg` for searching; avoid network actions unless required.
- Skip destructive commands unless explicitly requested.

## Editing Rules
- Default to ASCII; avoid unnecessary comments.
- Never revert user-authored changes; keep edits scoped.

## Planning & Reporting
- Use the planning tool for non-trivial work (2+ steps) and update after each step.
- Final replies stay concise, reference files as `path:line`, and suggest logical next steps when relevant.
