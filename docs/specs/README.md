# Feature specs

Specs for features that warranted explicit thinking before implementation.
Created by the `/spec` slash command, refined by humans, and used as the
brief for `/feature` (and eventually as the source of acceptance criteria
for review).

## When to write a spec

Write a spec when **any** of these apply:

- Feature touches more than 2 files
- Schema, RLS, or scoring changes
- UX has non-trivial states (loading / empty / error / success / locked / etc.)
- You can't easily fit acceptance criteria in a 1-line issue title

Skip the spec when:

- Bug fix with a known cause
- Pure refactor
- Copy/style/config tweak

## Naming

`YYYY-MM-DD-<kebab-slug>.md`

Examples:
- `2026-06-22-tiebreaker-rules.md`
- `2026-07-01-best-of-week-source.md`

## Lifecycle

1. **`draft`** — initial draft, in flight
2. **`approved`** — author + maintainer agree; ready to implement
3. **`implemented`** — code merged, may differ from spec (note differences)
4. **`shipped`** — live in production

Update the `Status:` line of the spec as it progresses.

## Template

See [`.claude/templates/spec.md`](../../.claude/templates/spec.md).

## Index

<!-- Add new entries on top. Format: date - title - status -->

_(No specs yet — first one to land here will be the i18n proposal in `docs/FOLLOWUPS.md`.)_
