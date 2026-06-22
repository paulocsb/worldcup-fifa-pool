---
name: spec
description: |
  Draft a structured specification for a feature BEFORE writing code. Saves
  to docs/specs/YYYY-MM-DD-<slug>.md using the template at
  .claude/templates/spec.md. Forces explicit thinking about acceptance
  criteria, data shape, and non-goals. Use before implementation for any
  non-trivial feature (>2 files, schema changes, UX with multiple states).
---

# /spec \<feature description\> — Spec-driven development

The user described what they want. Draft a structured spec capturing
the WHY and the WHAT, not the HOW. The spec is the contract: if the
final code diverges, it's documented at the bottom under "What shipped".

## Steps

### 1. Read the template

`.claude/templates/spec.md` is the canonical form. Don't invent new sections.

### 2. Slug the feature

Generate a kebab-case slug from the description:
- "tie-breaker rules for ranking" → `tiebreaker-rules`
- "show last 5 form badge per team" → `team-form-badge`
- "i18n support" → `i18n-support`

### 3. Filename

`docs/specs/YYYY-MM-DD-<slug>.md`

Use today's date. Get it from a script if needed, or accept the user's
mention.

### 4. Fill the template

For each section:

| Section | Source |
|---|---|
| **User story** | From the user's description. Pick the role explicitly. |
| **Acceptance criteria** | Translate the description into observable checkboxes. Each must be testable. |
| **Data shape** | Only if backend changes. Otherwise OMIT this section. |
| **UI sketch** | Only if frontend changes. ASCII layout welcome. Otherwise OMIT. |
| **Out of scope** | Be explicit. List what could be conflated but isn't. |
| **Risks** | What could go wrong. Pair each with a mitigation. |
| **Open questions** | What needs human input. Don't pretend you know everything. |
| **Verification plan** | Concrete checks: typecheck, test, audits, manual smoke. |

### 5. Honesty checks

Before writing:
- Are the acceptance criteria really testable, or are they aspirational?
- Is the "out of scope" list explicit (not just empty)?
- Did you list at least one risk?

If any "no", revise.

### 6. Save and confirm

Write to `docs/specs/YYYY-MM-DD-<slug>.md`.

Append to `docs/specs/README.md` index in the right place (top of the list).

Print to the user:

```
Spec saved at docs/specs/YYYY-MM-DD-<slug>.md

Key acceptance criteria:
- <criterion 1>
- <criterion 2>

Risks flagged:
- <risk 1>

Open questions for you:
- <question 1>
- <question 2>

Next step: /feature <slug> (uses this spec as the contract)
```

## When called from /feature

Skip the conversational format. Just produce the spec file. The
`/feature` workflow will surface it back to the user.

## Anti-patterns

- ❌ "User story" written as "we should add X" — that's not a story
- ❌ Acceptance criteria like "the feature works" — not testable
- ❌ Empty "Out of scope" — there's always something out of scope
- ❌ No "Risks" section — there's always at least one
- ❌ Writing implementation details (file names, function signatures) in the spec
  — those go in the plan from `/feature`

## Output language

The spec file content is in **English** (it's project documentation).
The conversation with the user mirrors their language (default pt-BR).
