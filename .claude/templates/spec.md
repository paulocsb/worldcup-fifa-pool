# <Feature title>

**Status**: draft <!-- draft | approved | implemented | shipped -->
**Slug**: <kebab-case-id>
**Issue**: #N <!-- if exists; omit otherwise -->
**Created**: YYYY-MM-DD
**Author**: AI session <!-- or human name -->

---

## User story

As a **<role>**, I want **<capability>**, so that **<benefit>**.

<!--
Roles in this app: bolão participant (default user), admin (manages invites),
new contributor. Pick the most specific.
-->

## Acceptance criteria

Each item MUST be observable/testable, not implementation detail.

- [ ] When **<input/action>**, then **<observable outcome>**.
- [ ] When **<edge case>**, then **<expected behavior>**.

## Data shape

<!-- Only fill if backend changes. Omit otherwise. -->

### Tables to add or modify

| Table | Field | Type | Constraint | Note |
|---|---|---|---|---|
| | | | | |

### RLS changes

| Table | Policy | Predicate |
|---|---|---|
| | | |

## UI sketch

<!-- Only fill if frontend changes. Omit otherwise. -->

Short description per route affected. ASCII layout is welcome.

**Mobile-first (320px) considered?** yes / no / n-a

**New components needed?** list them.

**Reuses existing components?** list them.

## Out of scope (explicit non-goals)

- ...
- ...

## Risks

- **<risk>**: <mitigation>.

## Open questions

- [ ] ...

## Verification plan

- [ ] `pnpm typecheck && pnpm build` clean
- [ ] `pnpm test` (Vitest) green; add a test if logic non-trivial
- [ ] `/mobile-audit` (if UI)
- [ ] `/scoring-verify` (if scoring touched)
- [ ] Manual smoke: <specific scenario>

---

<!--
After implementation, append a section "## What shipped" summarizing what
actually got built (may differ from initial proposal). Useful for future
reference.
-->
