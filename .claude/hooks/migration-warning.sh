#!/usr/bin/env bash
# Hook: warns when editing a SQL migration that ALREADY EXISTS on disk.
# Doesn't block — just reminds that applied migrations should be immutable.
# For real changes, create a NEW migration with a later timestamp.
set -euo pipefail

# Hook receives context via stdin (JSON with tool_input)
input=$(cat 2>/dev/null || echo '{}')

# Extract file_path from tool_input (uses jq if available, otherwise a simple regex)
if command -v jq >/dev/null 2>&1; then
  file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")
else
  file_path=$(echo "$input" | grep -oE '"file_path":[[:space:]]*"[^"]+"' | sed 's/.*"file_path":[[:space:]]*"\([^"]*\)".*/\1/' || echo "")
fi

# Only act if the path matches a SQL migration
case "$file_path" in
  *supabase/migrations/*.sql)
    if [[ -f "$file_path" ]]; then
      echo "⚠️  Editing EXISTING migration: $file_path" >&2
      echo "    Migrations are immutable once applied in production." >&2
      echo "    If this migration has already been applied via 'supabase db push'," >&2
      echo "    create a NEW migration (later timestamp) instead of editing this one." >&2
    fi
    ;;
esac

# Never blocks
exit 0
