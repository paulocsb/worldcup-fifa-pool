#!/usr/bin/env bash
# Hook: run silent typecheck at the end of a turn (Stop event).
# Runs only if .ts/.tsx files in src/ were modified in this session.
# Surfaces output only if the check fails.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

# Simple heuristic: check git status for .ts/.tsx modifications under src/
# (staged or unstaged — any recent edit counts).
if ! git status --porcelain 2>/dev/null | grep -qE '^.{1,2} (src/.+\.(ts|tsx)|tsconfig.*\.json)$'; then
  # Nothing relevant touched — skip
  exit 0
fi

# Run typecheck. Capture output. Surface only on failure.
if ! out=$(pnpm typecheck 2>&1); then
  echo "⚠️  pnpm typecheck FAILED after edits in src/:" >&2
  echo "$out" | tail -30 >&2
  exit 2  # exit 2 signals to Claude Code that there was a problem
fi

exit 0
