<!--
Thanks for the PR! A few quick prompts to make the review smooth.
Feel free to delete sections that don't apply.
-->

## Summary

<!-- 1–3 bullets describing what changed and why. -->

-
-

## Linked issues

Closes #
Refs #

## Specialized agent used (if any)

<!--
If you drove this PR with an AI agent (Claude Code, Cursor, Aider, etc.),
mentioning which specialized agent(s) you spun up helps reviewers calibrate.
-->

- [ ] `frontend`
- [ ] `supabase`
- [ ] `scoring`
- [ ] Generic / multi-domain
- [ ] No AI involved

## Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds with no new warnings
- [ ] If UI changes: ran `/mobile-audit` (or equivalent self-check from `docs/AI-WORKFLOW.md`)
- [ ] If scoring changes: ran `/scoring-verify` and confirmed the dual implementation (`src/lib/scoring.ts` ↔ `supabase/functions/_shared/scoring.ts`) stays in sync
- [ ] If DB / RLS changes: included a SQL verification query in the description
- [ ] No secrets committed (verified `.env*` not in the diff)
- [ ] Added/updated docs in `docs/` if behavior or contract changed

## Screenshots / GIFs (for UI changes)

<!-- Drag and drop. Bonus: include mobile 320px width if relevant. -->

## Notes for reviewer

<!-- Anything specific they should look at, trade-offs you made, follow-up work, etc. -->
