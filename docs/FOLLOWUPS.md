# Follow-ups — Bolão FIFA 2026

Parked items to revisit. Reorder/check off as you tackle them.

---

## 🟡 Pending decisions

- [ ] **Customize magic-link HTML template in Supabase** — branded HTML already drafted in the 2026-06-17 conversation (FIFA 2026, navy + gold, pt-BR). Apply at **Authentication → Email Templates → Magic Link** in the dashboard.

---

## 🔵 Incremental improvements

- [ ] **Highlight champion pick on the bracket** — visually highlight the path of the team the user predicted to win (gold lines/border across phases). Integrates `tournament_predictions` with `BracketPhase` / `BracketFullView` (the bracket currently consumes `useMyPredictions` for match scores only, not the champion pick).

- [ ] **Route-level code splitting** — use `React.lazy` + `Suspense` to shrink initial bundle (~180KB gzip → ~100KB). Each route loads on demand.

- [ ] **(Optional) True SVG connector lines on the bracket** — the bracket ships with CSS connector stubs (deliberate, see `BracketFullView.tsx`). Replacing them with real SVG `<path>` lines between feeders would read cleaner at full zoom. Pure polish.

---

## 🟢 Ongoing operational

- [ ] **Smoke test for a brand-new friend flow** — grab the share link, sign up from scratch, predict, see the ranking. Validate everything flows without friction.

- [ ] **Confirm `Inactivity Timeout` / `Session Time-box` are disabled** in Supabase dashboard → Authentication → Sessions. Ensures the session "never logs out" even after months of inactivity.
