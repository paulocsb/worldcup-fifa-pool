# FIFA World Cup 2026 Rebrand — Design System

Reference document for the app's visual transition to the official 2026 World
Cup system (Pangram Pangram + internal brand guidelines). Based on 9 reference
brand screenshots shared on 2026-06-16.

## Principles

1. **No single primary color** — the brand uses a contextual rainbow palette. Each **group (A–L)**, each **phase (group → final)**, and each **cerimonial position (gold/silver/bronze)** has its own color.
2. **Contextual background per section** — the app background changes per page (dark by default, green during group stage, phase-tinted in knockouts, gold at the top of the ranking).
3. **Signature motif: quarter-circle cut** — replaces diagonals. Defines the visual DNA.
4. **Typography**: Saira Condensed (display) + Noto Sans (body). Free substitutes for the official FWC2026 typeface.

## Palette — HSL tokens

### Groups (12 saturated colors, distinct identity for each group)
| Token | HSL | Group |
|---|---|---|
| `--group-a` | `142 71% 58%` | lime-green |
| `--group-b` | `0 84% 60%` | red |
| `--group-c` | `25 95% 53%` | orange |
| `--group-d` | `226 71% 40%` | deep blue |
| `--group-e` | `271 81% 56%` | purple |
| `--group-f` | `48 96% 53%` | yellow |
| `--group-g` | `330 81% 60%` | magenta |
| `--group-h` | `187 85% 53%` | cyan |
| `--group-i` | `215 16% 47%` | slate-blue |
| `--group-j` | `158 64% 39%` | emerald |
| `--group-k` | `11 86% 65%` | coral |
| `--group-l` | `199 89% 60%` | sky |

### Phases (7 colors)
| Token | HSL | Phase |
|---|---|---|
| `--phase-group` | `142 71% 45%` | green |
| `--phase-r32` | `271 81% 56%` | purple |
| `--phase-r16` | `25 95% 53%` | orange |
| `--phase-quarter` | `84 81% 50%` | lime |
| `--phase-semi` | `187 85% 53%` | cyan |
| `--phase-third` | `32 95% 44%` | bronze-ish |
| `--phase-final` | `48 96% 53%` | yellow (champion color) |

### Cerimonial positions
| Token | HSL | Use |
|---|---|---|
| `--accent-gold` | `43 65% 52%` (current) | champion / top 1 |
| `--accent-silver` | `215 14% 65%` | runner-up / top 2 |
| `--accent-bronze` | `30 76% 36%` | 3rd place |

## Typography

- **Display** (titles, numbers, scores): **Saira Condensed Black/Bold** (Google Fonts)
- **Body** (running text): **Noto Sans** (Google Fonts, official secondary brand)
- Replace Bricolage Grotesque + Inter from the previous rebrand.

## Signature motif

`.cut-corner-tl` / `.cut-corner-tr` / `.cut-corner-bl` / `.cut-corner-br` — utility classes that apply a quarter-circle cut on the element's corner. Implemented via `clip-path` or `mask-image: radial-gradient`.

## Contextual background (per route)

| Route | Background |
|---|---|
| `/login`, `/`, `/onboarding`, `/profile` | dark navy-pitch (current) |
| `/matches` | dark, but cards get group/phase accent |
| `/predictions/groups` | dark with subtle neon-green pattern |
| `/predictions/groups/:letter` | tinted with group color (5–10% opacity) |
| `/predictions/tournament` | dark with gold banner at the top |
| `/ranking` | dark; top-1 card with intensified gold bg |
| `/matches/:id` (final phase) | yellow ribbon in the header |

## Components

### New
- `src/lib/groupColors.ts` — `groupColor(letter)`, `phaseColor(stage)` → CSS var token
- `src/components/GroupPill.tsx` — colored pill with the group letter
- `src/components/PhasePill.tsx` — pill for the tournament phase
- `src/components/PositionBadge.tsx` — gold/silver/bronze badge for the top 3

### Update
- `MatchCard` — header with GroupPill/PhasePill + accent border in the right color
- `MatchStatusBadge` — live minute tinted with phase color
- `BottomNav` — active indicator gradient by route
- `ranking.tsx` — top 1/2/3 with entire card tonalized
- `predictions/groups.tsx`, `groups/:letter.tsx` — cards and header in their own color
- `match-detail.tsx` — final phase gets a yellow ribbon

## Implementation order

1. **Tokens + fonts** (base) — `index.html`, `tailwind.config.ts`, `src/index.css`
2. **lib/groupColors + 3 new pills** (isolated components)
3. **MatchCard + MatchStatusBadge** (high impact, validates the system)
4. **Tinted routes** (`/predictions/groups`, `/matches`)
5. **Cerimonial ranking** (top 1/2/3 + tournament page)
6. **Contextual background + quarter-circle** (final polish)
7. **Smoke test** (dark+light, real mobile, clean build)

## Verification

- `pnpm typecheck && pnpm build` after each step
- WCAG AA: contrast on colored backgrounds (especially yellow `--phase-final`)
- Dark mode: group/phase colors have a dark variant (lighter saturation if needed)
- Real mobile: colored pills legible at 320px width

## Non-goals

- Don't license the official FWC2026 typeface (Pangram Pangram, paid) — Saira Condensed covers it
- Don't try to reproduce the photorealistic trophy from the references — out of scope
- Don't replace DiceBear avatars with the "We Are 26" host-city campaign
