# Follow-ups — Bolão FIFA 2026

Parked items to revisit. Reorder/check off as you tackle them.

---

## 🟡 Pending decisions

- [ ] **Universal group-prediction lock** — replace the "5min before each group's MD3" rule with a single timestamp (e.g., 2026-06-19 23:59 or 2026-06-23 23:59). Awaiting confirmation from the friends group on WhatsApp. Implementation: see plan saved in the 2026-06-18 conversation (1 new migration + adjustment in `useGroupLocks` + text in `rules.tsx`).

- [ ] **Customize magic-link HTML template in Supabase** — branded HTML already drafted in the 2026-06-17 conversation (FIFA 2026, navy + gold, pt-BR). Apply at **Authentication → Email Templates → Magic Link** in the dashboard.

- [ ] **App i18n (pt-BR + en)** — UI is currently 100% pt-BR. Make it bilingual using `react-i18next`. Effort estimate: ~6–7h (lib setup + string extraction across ~30 routes/components + verification). Good candidate for the first community PR.

---

## 🔵 Incremental improvements

- [ ] **Bracket with lines connecting matches** — replace the knockout-stage card list with a visual bracket using SVG lines between phases (v2 of `/standings`). Complex on mobile without polish, but more illustrative.

- [ ] **Highlight champion pick on the bracket** — visually highlight the path of the team the user predicted to win (gold lines/border across phases). Integrates `tournament_predictions` with `BracketPhase`.

- [ ] **Route-level code splitting** — use `React.lazy` + `Suspense` to shrink initial bundle (~180KB gzip → ~100KB). Each route loads on demand.

- [ ] **Migrate ESLint to flat config** — `pnpm lint` is broken due to legacy config. Update `.eslintrc.*` → `eslint.config.js` (new ESLint 9 format).

---

## 🟢 Ongoing operational

- [ ] **Smoke test for a brand-new friend flow** — grab the share link, sign up from scratch, predict, see the ranking. Validate everything flows without friction.

- [ ] **Confirm `Inactivity Timeout` / `Session Time-box` are disabled** in Supabase dashboard → Authentication → Sessions. Ensures the session "never logs out" even after months of inactivity.

---

## ✅ Completed in this window

(prune/archive when this gets too long)

- [x] localStorage for invite (PWA reopening)
- [x] Mark existing sessions as returning users on boot
- [x] Resend SMTP + DNS
- [x] BottomNav iOS scroll detachment (inner scroll container)
- [x] Phase tabs on `/standings` + knockout bracket
- [x] MatchTimer on scoreboard
- [x] Match events sorted descending
- [x] Column alignment on standings
- [x] Live score stuck fix (sync-live UTC date range + safety-net cron)
- [x] Operational `docs/SCORING.md`
- [x] `/me/predictions` screen + Phase 2 (others' predictions post-lock)
- [x] Prediction card redesign (palpite as the protagonist)
- [x] PageHeader respects browser history
- [x] Live / Finished / Waiting sections on `/me/predictions`
- [x] Cloudflare NODE_VERSION=22
- [x] AI-first agent suite (3 agents + 7 skills + 2 hooks)
- [x] Repository internationalization (docs/agents/skills translated to English)
- [x] LICENSE, CONTRIBUTING.md, AGENTS.md, SETUP.md
