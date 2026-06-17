# Rebrand FIFA World Cup 2026 — Sistema de Design

Documento de referência para a transição visual do app para o sistema oficial da Copa 2026 (Pangram Pangram + brand guidelines internos). Baseado em 9 screenshots de referência da marca compartilhados em 16/06/2026.

## Princípios

1. **Sem cor primária única** — a marca usa paleta arco-íris contextual. Cada **grupo (A–L)**, cada **fase (group → final)** e cada **posição cerimonial (gold/silver/bronze)** tem cor própria.
2. **Background contextual por seção** — o fundo da app muda conforme a página (dark padrão, verde nos grupos, fase-tinted nos mata-matas, gold no top do ranking).
3. **Motivo signature: quarter-circle cut** — substitui as diagonais. Define o DNA visual.
4. **Tipografia**: Saira Condensed (display) + Noto Sans (body). Substitutos free do FWC2026 oficial.

## Paleta — tokens HSL

### Grupos (12 cores saturadas, identidade própria de cada grupo)
| Token | HSL | Grupo |
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

### Fases (7 cores)
| Token | HSL | Fase |
|---|---|---|
| `--phase-group` | `142 71% 45%` | green |
| `--phase-r32` | `271 81% 56%` | purple |
| `--phase-r16` | `25 95% 53%` | orange |
| `--phase-quarter` | `84 81% 50%` | lime |
| `--phase-semi` | `187 85% 53%` | cyan |
| `--phase-third` | `32 95% 44%` | bronze-ish |
| `--phase-final` | `48 96% 53%` | yellow (cor do campeão) |

### Posição cerimonial
| Token | HSL | Uso |
|---|---|---|
| `--accent-gold` | `43 65% 52%` (atual) | campeão / top 1 |
| `--accent-silver` | `215 14% 65%` | vice / top 2 |
| `--accent-bronze` | `30 76% 36%` | 3º lugar |

## Tipografia

- **Display** (títulos, números, scores): **Saira Condensed Black/Bold** (Google Fonts)
- **Body** (texto corrido): **Noto Sans** (Google Fonts, brand secundário oficial)
- Substituem Bricolage Grotesque + Inter no rebrand anterior.

## Motivo signature

`.cut-corner-tl` / `.cut-corner-tr` / `.cut-corner-bl` / `.cut-corner-br` — utility classes que aplicam um corte em quarto de círculo no canto do elemento. Implementação via `clip-path` ou `mask-image: radial-gradient`.

## Background contextual (por rota)

| Rota | Background |
|---|---|
| `/login`, `/`, `/onboarding`, `/profile` | navy-pitch dark (atual) |
| `/matches` | dark, mas cards ganham accent do grupo/fase |
| `/predictions/groups` | dark com pattern verde-neon sutil |
| `/predictions/groups/:letter` | tinted com cor do grupo (5-10% opacity) |
| `/predictions/tournament` | dark com banner gold no topo |
| `/ranking` | dark; card do top 1 com bg gold intensificado |
| `/matches/:id` (fase final) | ribbon yellow no header |

## Componentes

### Novos
- `src/lib/groupColors.ts` — `groupColor(letter)`, `phaseColor(stage)` → token CSS var
- `src/components/GroupPill.tsx` — pill colorida com letra do grupo
- `src/components/PhasePill.tsx` — pill da fase do torneio
- `src/components/PositionBadge.tsx` — badge gold/silver/bronze pro top 3

### Atualizar
- `MatchCard` — header com GroupPill/PhasePill + accent border na cor
- `MatchStatusBadge` — minuto live tinta na fase
- `BottomNav` — indicador ativo no gradient da rota
- `ranking.tsx` — top 1/2/3 com card inteiro tonalizado
- `predictions/groups.tsx`, `groups/:letter.tsx` — cards e header em cor própria
- `match-detail.tsx` — fase final ganha ribbon amarelo

## Ordem de implementação

1. **Tokens + fonts** (base) — `index.html`, `tailwind.config.ts`, `src/index.css`
2. **lib/groupColors + 3 pills novos** (componentes isolados)
3. **MatchCard + MatchStatusBadge** (alto impacto, valida sistema)
4. **Rotas tinted** (`/predictions/groups`, `/matches`)
5. **Ranking cerimonial** (top 1/2/3 + tournament page)
6. **Background contextual + quarter-circle** (polish final)
7. **Smoke test** (dark+light, mobile real, build limpo)

## Verificação

- `pnpm typecheck && pnpm build` a cada etapa
- WCAG AA: contraste em fundos coloridos (especialmente yellow `--phase-final`)
- Dark mode: cores grupo/fase têm variante dark (lighter saturation se necessário)
- Mobile real: pills coloridos legíveis em 320px width

## Não-objetivos

- Não loadar FWC2026 oficial (Pangram Pangram, paga) — Saira Condensed cobre
- Não tentar reproduzir o trofeu fotorrealístico das refs — fora do escopo
- Não substituir avatares DiceBear pelo "We Are 26" host-city campaign
