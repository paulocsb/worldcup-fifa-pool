---
name: mobile-audit
description: |
  Mobile/PWA audit of files in the current diff (or a specific path). Runs a
  10+ criteria checklist: viewport, tap targets, safe-area, scroll, dark mode,
  performance, PWA lifecycle. Use BEFORE declaring a UI feature done — replaces
  the superficial "I tried it in DevTools" check.
---

# /mobile-audit — Mobile/PWA pre-done checklist

Audits modified files (or a specific path passed as arg) against a senior
mobile/PWA checklist. Failure = list of items to fix.

## How to run

Without args: pulls `git diff` of the current branch vs `main` and identifies modified UI files (`src/components/**`, `src/routes/**`).
With arg `<path>`: audits only that path.

For each file, **read the code** and verify the criteria below. DO NOT rely on
DevTools tests — static analysis + recommendation to test on a real device.

## Checklist (10 criteria)

### 1. Viewport baseline 320px
- [ ] No intentional `overflow-x` on the body/main.
- [ ] No hardcoded min-width >= 360px (`min-w-[400px]`).
- [ ] Truncate on long text (`truncate`, `line-clamp-N`).
- [ ] Images with `max-width: 100%` (Tailwind `max-w-full`).

### 2. Tap targets ≥ 44px
- [ ] Buttons with height ≥ 44px (`h-11` Tailwind = 2.75rem = 44px).
- [ ] Clickable links in lists with `py-2.5+` or `min-h-11`.
- [ ] Icon-only (no text) clickables with `grid size-9+ place-items-center` container.
- [ ] Minimum gap of 8px between adjacent targets (`gap-2`).

### 3. Safe-area (iOS notch + home indicator)
- [ ] Root layout uses `.pb-nav` or equivalent padding respecting `env(safe-area-inset-bottom)`.
- [ ] BottomNav has `.safe-bottom`.
- [ ] Fixed headers with `.safe-top` if applicable.
- [ ] Viewport height uses `h-dvh` (NEVER `100vh` on the root).

### 4. Scroll behavior
- [ ] Vertical-scroll container is the inner `<main>` (not the body) — pattern `flex h-dvh flex-col` + `flex-1 overflow-y-auto`.
- [ ] BottomNav is IN-FLOW within the flex column, NOT `position: sticky bottom-0` nor `position: fixed`.
- [ ] Horizontal scroll (pills/tabs) has `snap-x snap-mandatory` + `.scrollbar-none`.
- [ ] `overscroll-contain` on containers that shouldn't propagate scroll.

### 5. Touch interactions
- [ ] No hover-only states. `:hover` is OK as an addition, not as the only state.
- [ ] `active:scale-[0.98]` or similar on buttons/cards (tactile feedback).
- [ ] Nothing depending on `mouseenter`/`mouseleave` events.

### 6. Dark mode
- [ ] Colors via HSL tokens (`--background`, `--card`, `--foreground`, etc.) — no literal colors.
- [ ] Body text NOT in `gold` (poor contrast — only for icon/border/highlight).
- [ ] Minimum WCAG AA contrast (4.5:1 for text < 18px, 3:1 for >= 18px or bold >= 14px).

### 7. Mobile typography
- [ ] Body text >= 14px (`text-sm` minimum).
- [ ] `font-display` (Saira Condensed) only for titles/numbers, not paragraphs.
- [ ] Comfortable line-height (`leading-relaxed` for paragraphs).

### 8. Performance
- [ ] No `useEffect` with `setInterval` for polling — use Realtime.
- [ ] Long lists (>50 potential items) consider virtualization (not required if always < 50).
- [ ] Large images: `loading="lazy"` if outside the initial viewport.
- [ ] Reasonable bundle delta (`pnpm build` before/after, compare gzip size).

### 9. PWA lifecycle
- [ ] Service worker won't cache dynamic API responses (only static assets).
- [ ] localStorage used for invite (`src/lib/inviteStorage.ts`) + returning-user flag.
- [ ] No dependency on the Safari URL bar (PWA standalone doesn't have one).

### 10. i18n / language
- [ ] UI strings in **pt-BR** (audience: Brazilian friends).
- [ ] Error messages also in pt-BR.
- [ ] Identifiers, comments, commit messages in English (per CLAUDE.md).
- [ ] Date formatting via `date-fns` with the `ptBR` locale.

## Report format

For each file, generate a table:

```
src/components/MyNewComponent.tsx
├─ 1. Viewport 320px            ✅
├─ 2. Tap targets ≥ 44px        ❌ Button is `h-8` (32px) — use `h-11`
├─ 3. Safe-area                  ✅
├─ 4. Scroll behavior            n/a (component, not layout)
├─ 5. Touch interactions         ⚠️ Hover-only tooltip — add a fallback
├─ 6. Dark mode                  ✅
├─ 7. Typography                 ✅
├─ 8. Performance                ✅
├─ 9. PWA lifecycle              n/a
└─ 10. i18n                       ❌ "Save" and "Cancel" hardcoded in English
```

## Final recommendations

After the checklist, recommend:
1. **Blocker** (red ❌): list mandatory fixes before merging.
2. **Attention** (yellow ⚠️): nice-to-have, note but can pass.
3. **Real-device test**: remind the user to test via `pnpm dev --host` on a real iPhone if it's a significant visual feature.

## Output

- **Language**: mirror the user (default pt-BR).
- **Tone**: expert, opinionated. Doesn't soften real problems.
- **End with** a summary: `N blockers, M attentions, X passed`. If 0 blockers → ✅ approved to merge.
