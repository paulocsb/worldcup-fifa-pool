# Contributing

Thanks for considering a contribution! This project is structured to make it
easy to contribute *with the help of an AI agent*, even if you're new to one
or more parts of the stack (React, Supabase, edge functions, etc.).

## TL;DR

1. **Fork** the repo
2. **Set up locally** by following [`docs/SETUP.md`](docs/SETUP.md) — you'll need your own Supabase project + API-Football key
3. **Pick an issue** labeled `good first issue` (or propose one in Discussions)
4. **Open your AI agent of choice** (Claude Code, Cursor, Aider, etc.) — see [`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md)
5. **Write code, run `pnpm typecheck && pnpm build`** before opening the PR
6. **Open a PR** — CI will run typecheck and build automatically

---

## Working with AI agents

This repo is "AI-first": the `.claude/` directory ships specialized agents and
slash commands calibrated to the codebase. They reduce the chance of an AI
producing generic React advice that doesn't fit our patterns.

### If you use Claude Code

Just open the repo. The agents (`frontend`, `supabase`, `scoring`) and skills
(`/db-status`, `/mobile-audit`, etc.) appear in the agent list automatically.
`CLAUDE.md` is loaded as context.

Examples:

```text
Use the frontend agent to add a "best of the week" card to the home screen.
```

```text
/mobile-audit
(audits the files in your current diff)
```

### If you use Cursor, Aider, Cline, Continue, or another tool

These tools can't read `.claude/` natively. Instead, they read `AGENTS.md` in
the repo root — a tool-agnostic spec that mirrors the same conventions.

See [`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md) for tool-specific entry points.

### If you don't use AI at all

Totally fine. Read `CLAUDE.md` and the docs under `docs/` as a human, follow
the file conventions, and open the PR. The repo wasn't built around AI as a
requirement, just optimized for it.

---

## Code conventions

- **Language**: code, identifiers, comments, commit messages, and docs are in **English**. The user-facing UI is in **pt-BR** for now (i18n is on the followups list — `docs/FOLLOWUPS.md`).
- **TypeScript strict**: no implicit `any`. Use `unknown` + narrowing.
- **Discriminated unions** over optional fields for variant shapes.
- **Tailwind** with `cn()` for conditional classes. No inline styles unless necessary.
- **Mobile-first**: design from 320px up, ≥44px tap targets, test on a real iPhone via `pnpm dev --host` for any visual change.
- **Reuse > new code**: search `src/lib/`, `src/hooks/`, `src/components/` before creating a new file. The `frontend` agent has the full catalog.
- **No polling**: live data uses Supabase Realtime via `useRealtimeInvalidator`.
- **No client writes to protected tables**: `matches`, `teams`, `scores`, `scoring_config` are server-only (Edge Functions with service role).
- **Migrations are immutable** once applied to production. Create a new migration; never edit an existing one. The `migration-warning.sh` hook will remind you.

The `frontend`, `supabase`, and `scoring` agents enforce these in detail.

---

## Commit messages

We don't enforce a strict convention, but the project leans on Conventional Commits:

```
feat: add /me/predictions screen with tabs by source
fix: BottomNav iOS scroll detachment
docs: translate scoring pipeline to English
refactor: extract prediction lock helper
chore: bump Node version to 22
```

This helps the `/release-notes` slash command auto-categorize work for the
end-user changelog.

---

## Pull request checklist

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds with no new warnings
- [ ] If you touched UI, ran `/mobile-audit` (or the equivalent checklist in `docs/AI-WORKFLOW.md`)
- [ ] If you touched scoring, ran `/scoring-verify` or equivalent
- [ ] If you touched RLS / schema / migrations, ran `/db-status` and `/security-sweep`
- [ ] Added/updated docs if behavior or contract changed
- [ ] Did not commit any `.env*` file (only `.env.example`)
- [ ] Did not commit any secret (service role key, API-Football key, etc.)

CI will block your PR if typecheck/build fails. Other checks are honor-system
for now (we'll add lint and tests as the codebase matures).

---

## Issues

For bugs, please open an issue with:

- What you expected vs. what happened
- Steps to reproduce (with concrete inputs, not "sometimes it doesn't work")
- Browser/device if it's a frontend issue
- Logs from `supabase functions logs <name>` if it's a backend issue

For feature proposals, open a Discussion first to align scope.

---

## Code of conduct

Be kind. Disagreements are fine — personal attacks aren't. The maintainer
reserves the right to close issues/PRs that don't respect this baseline.

---

## License

By contributing, you agree your changes are licensed under the [MIT license](LICENSE).
