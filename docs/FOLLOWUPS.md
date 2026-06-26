# Follow-ups — Bolão FIFA 2026

Parked items to revisit. Reorder/check off as you tackle them.

---

## 🟡 Pending decisions

- [ ] **Customize magic-link HTML template in Supabase** — branded HTML already drafted in the 2026-06-17 conversation (FIFA 2026, navy + gold, pt-BR). Apply at **Authentication → Email Templates → Magic Link** in the dashboard.

---

## 🔵 Incremental improvements

- [ ] **Bracket with lines connecting matches** — replace the knockout-stage card list with a visual bracket using SVG lines between phases (v2 of `/standings`). Complex on mobile without polish, but more illustrative.

- [ ] **Highlight champion pick on the bracket** — visually highlight the path of the team the user predicted to win (gold lines/border across phases). Integrates `tournament_predictions` with `BracketPhase`.

- [ ] **Route-level code splitting** — use `React.lazy` + `Suspense` to shrink initial bundle (~180KB gzip → ~100KB). Each route loads on demand.

---

## 🟢 Ongoing operational

- [ ] **Smoke test for a brand-new friend flow** — grab the share link, sign up from scratch, predict, see the ranking. Validate everything flows without friction.

- [ ] **Confirm `Inactivity Timeout` / `Session Time-box` are disabled** in Supabase dashboard → Authentication → Sessions. Ensures the session "never logs out" even after months of inactivity.

---

## 🚀 Before going public

The repository is feature-complete and AI-first ready, but still **private**.
Before flipping visibility to public, complete these:

- [ ] **Create 3–5 `good first issue` issues** so contributors have a clear entry point. Suggested set:
  - i18n: pt-BR + en with `react-i18next` (high-value, well-scoped — see followups above)
  - Route-level code splitting with `React.lazy` (measurable bundle impact)
  - Bracket with SVG lines connecting matches
  - Expand test coverage beyond `src/lib/` (e.g. a hook or a critical component) — the Vitest infra is already in place
- [ ] **Enable GitHub Discussions** (Settings → General → Features → Discussions ✅) for questions that don't fit as issues
- [ ] **Add repo topics** for discoverability: `ai-first`, `claude-code`, `agents-md`, `supabase`, `react`, `typescript`, `vite`, `pwa`, `world-cup-2026`, `tailwindcss`, `shadcn-ui`
- [ ] **Branch protection on `main`** (Settings → Branches → Add rule → require PR + CI passing)
- [ ] **Flip repo visibility to public** (Settings → General → Danger Zone → Change visibility)

---

## ✅ Completed in this window

(prune/archive when this gets too long)

### Product features
- [x] localStorage for invite (PWA reopening)
- [x] Mark existing sessions as returning users on boot
- [x] BottomNav iOS scroll detachment (inner scroll container)
- [x] Phase tabs on `/standings` + knockout bracket
- [x] MatchTimer on scoreboard
- [x] Match events sorted descending
- [x] Column alignment on standings
- [x] `/me/predictions` screen + Phase 2 (others' predictions post-lock)
- [x] Prediction card redesign (palpite as the protagonist)
- [x] PageHeader respects browser history
- [x] Live / Finished / Waiting sections on `/me/predictions`

### Infrastructure
- [x] Vitest test infra + first tests (`src/lib/scoring.test.ts`, `src/lib/bracketNodes.test.ts`) — wired into `pnpm test`, `/verify`, `/ship`, and CI
- [x] ESLint migrated to flat config (`eslint.config.js`, ESLint 9) — `pnpm lint` passes (0 errors)
- [x] Resend SMTP + DNS
- [x] Live score stuck fix (sync-live UTC date range + safety-net cron)
- [x] Cloudflare NODE_VERSION=22
- [x] Cloudflare Workers config (`wrangler.jsonc` versioned, `pnpm run deploy` script, docs updated)

### AI-first repo setup
- [x] AI-first agent suite (4 agents incl. `code-reviewer` + 18 skills + 2 hooks)
- [x] Repository internationalization (docs/agents/skills translated to English)
- [x] LICENSE (MIT + FIFA brand note), CONTRIBUTING.md, AGENTS.md (cross-tool spec), docs/SETUP.md, docs/AI-WORKFLOW.md
- [x] Operational `docs/SCORING.md`
- [x] GitHub Actions CI (typecheck + build on PR)
- [x] `.gitignore` hardened (`.claude/settings.local.json`, `*.tsbuildinfo`, `.wrangler/`, `.dev.vars*`)
