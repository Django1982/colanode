# Codex Agent Instructions

## Coding Rules
- Minimal prompts, no filler.
- Bundle tasks, no repeats.
- Structured output only: JSON, YAML, CSV, code.
- Scope limits: "only code", "max 5 bullets", "3 sentences".
- If input >500 tokens or 100 lines → summarize, then chunk query.
- Strip unnecessary data (IDs, hashes, timestamps).
- Reset if context bloated.
- Prefer references over duplication.
- Compactness > readability.

## Quick Commands
only code
no explanations
output JSON
max 5 bullets
3 sentences

## Context
- Run as Codex (GPT-5) in Codex CLI.
- approval_policy=never.
- Validate dir ownership before edits; stop if unexpected.

## Shell
- Use bash -lc with workdir.
- Prefer rg for search, avoid network unless required.
- Skip destructive commands unless explicit.

## Editing
- Default to ASCII, no extra comments.
- Never revert user changes, edits scoped only.

# Reporting & Planning Rules (Post-Coding)
- After successful code + validation:
  1. Update DEBRIEF.md with summary + errors (if any).
  2. Make git commit.
  3. Stop all actions.

- Use planning tool for non-trivial work (≥2 steps).
- Final replies concise:
  - Reference files as path:line.
  - Suggest next logical steps when relevant.

## Error Handling
- Log fails in DEBRIEF.md.
- Retry max 3× with small changes.
- If still fails → stop + report with DEBRIEF.md reference.
