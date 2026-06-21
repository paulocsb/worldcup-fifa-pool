# FIFA World Cup 2026 — Official Format (reference)

Reference document for the prediction-pool implementation. Primary source:
FIFA regulations + Wikipedia. Cross-check the official page on any doubt:
https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026

---

## 1. Overview

- **Host countries**: Canada, Mexico, and the United States (16 cities).
- **Window**: June 11 to July 19, 2026.
- **Number of teams**: **48** (first expanded edition; 32 since 1998).
- **Total matches**: **104**
  - Group stage: 72
  - Knockout: 32 (16 + 8 + 4 + 2 + 1 final + 1 third-place play-off)
- **Final**: 2026-07-19 — MetLife Stadium, East Rutherford, New Jersey (USA).
- **Third-place play-off**: 2026-07-18.

---

## 2. Group stage

### 2.1 Structure
- **12 groups** (A through L), each with **4 teams**.
- Each team plays **3 matches** (round-robin within the group).
- **Scoring**: 3 pts win / 1 pt draw / 0 loss.
- **Window**: June 11 to June 27, 2026.

### 2.2 Groups (draw held on 2025-12-05, Washington D.C.)

| Group | Pot 1 | Pot 2 | Pot 3 | Pot 4 |
|---|---|---|---|---|
| **A** | Mexico | South Korea | South Africa | Czechia |
| **B** | Canada | Switzerland | Qatar | Bosnia & Herzegovina |
| **C** | Brazil | Morocco | Scotland | Haiti |
| **D** | USA | Paraguay | Turkey | Australia |
| **E** | Germany | Ecuador | Ivory Coast | Curaçao |
| **F** | Netherlands | Japan | Sweden | Tunisia |
| **G** | Belgium | Egypt | Iran | New Zealand |
| **H** | Spain | Uruguay | Saudi Arabia | Cape Verde |
| **I** | France | Senegal | Norway | Iraq |
| **J** | Argentina | Austria | Algeria | Jordan |
| **K** | Portugal | Colombia | Uzbekistan | DR Congo |
| **L** | England | Croatia | Ghana | Panama |

> **Note**: the pot columns are for reference (pot ordering at the time of the draw). What matters for the pool is the group composition, not the pot order.

---

## 3. Qualification to the knockout stage

Advancing to the **Round of 32**:

- **1st place from each group** → 12 slots
- **2nd place from each group** → 12 slots
- **8 best 3rd-placed teams** out of 12 → 8 slots

**Total: 32 teams advance. 16 are eliminated in the group stage** (4 last-placed + 4 worst 3rd-placed).

### 3.1 Tiebreakers within a group (official order)

When two or more teams finish tied on **points**, apply in this order:

1. **Points in head-to-head matches** between the tied teams.
2. **Goal difference in head-to-head matches** between the tied teams.
3. **Goals scored in head-to-head matches** between the tied teams.
4. If 2+ teams remain tied after re-applying 1–3 among them, continue:
5. **Goal difference** across all group matches.
6. **Goals scored** across all group matches.
7. **Fair play / conduct** — card points:
   - Yellow card: **−1**
   - 2nd yellow (indirect red): **−3**
   - Direct red: **−4**
   - Yellow + direct red: **−5**
8. **FIFA Ranking** (most recent edition published before the tournament) — used as the final criterion instead of a draw.

### 3.2 Criteria for ranking the 8 best 3rd-placed teams

Comparison **across the 12 third-placed teams**, in this order:

1. **Points** earned.
2. **Goal difference** across all group matches.
3. **Goals scored** across all group matches.
4. **Fair play / conduct** (same formula as section 3.1).
5. **FIFA Ranking**.

The top 8 advance; the bottom 4 third-placed teams are eliminated.

---

## 4. Knockout stage

### 4.1 Phases
1. **Round of 32** — **NEW in 2026** — 16 matches
2. **Round of 16** — 8 matches
3. **Quarter-finals** — 4 matches
4. **Semi-finals** — 2 matches (July 14 and 15)
5. **Third-place play-off** — 1 match (July 18)
6. **Final** — 1 match (July 19, MetLife Stadium)

### 4.2 General rules
- Single-elimination.
- Tied at **90 min** → **30 min extra time** (2×15 min).
- Tied at the end of extra time → **penalties**.
- Third-place play-off follows the same rules.

### 4.3 Bracket structure (Round of 32)

The bracket is **pre-defined** (no new draw after the group stage). Matchups
follow the regulation (Annex C of the FIFA regulations, with 495 possible
combinations depending on which groups produce the 8 best 3rd-placed teams).

**Fixed matchups confirmed**:

| Matchup | Origin |
|---|---|
| Winner C × Runner-up F | Winner of group C vs 2nd of group F |
| Winner F × Runner-up C | Winner of group F vs 2nd of group C |
| Winner H × Runner-up J | Winner of group H vs 2nd of group J |
| Winner J × Runner-up H | Winner of group J vs 2nd of group H |
| Runner-up A × Runner-up B | 2nd of A vs 2nd of B |
| Runner-up E × Runner-up I | 2nd of E vs 2nd of I |
| Runner-up D × Runner-up G | 2nd of D vs 2nd of G |
| Runner-up K × Runner-up L | 2nd of K vs 2nd of L |

**Winners of groups A, B, D, E, G, I, K, L** face one of the **8 best 3rd-placed
teams**, with specific allocation depending on **which groups** produced the
qualifying 3rd-placed teams (Annex C rule).

> **Pool implication**: the "champion" and "top 3" predictions are stable (independent of the bracket), but predictions about specific knockout matchups only make sense after the group stage ends (June 27).

---

## 5. Implications for the pool implementation

### 5.1 Data model (`docs/PLAN.md`)
- The `teams` table needs the `group_letter` enum/column with values `A..L`. ✅ already done.
- The `matches` table needs `stage` with at least: `group`, `round_of_32`, `round_of_16`, `quarter_final`, `semi_final`, `third_place`, `final`. Update enum in `001_init.sql`.
- The `teams` table needs `fifa_ranking` (int) to implement tiebreakers.
- The `matches` table should track cards for fair-play computation if we want to score qualification bonuses with tiebreakers → **decision**: for MVP we don't compute tiebreakers internally. We trust the final `position` returned by API-Football, which already applies all criteria.

### 5.2 Group-stage prediction
Per group, the user predicts the **final order of the 4 teams**: 1st, 2nd, 3rd, 4th. The qualification bonus compares against the official order.

- **Attention**: the "advances to the Round of 32" prediction has two components:
  - **Top 2 of the group**: guaranteed to advance.
  - **3rd of the group**: advances **only** if among the 8 best 3rd-placed teams globally.
- UI suggestion: when predicting group order, show a "going to the Round of 32?" tag on the 3rd-placed team (depends on global comparison).

### 5.3 Scoring for the group stage (revised from `PLAN.md`)
Instead of fixed points per position, refined suggestion:
- **5 pts** for the exact 1st
- **5 pts** for the exact 2nd
- **3 pts** for the exact 3rd
- **2 pts** for the exact 4th
- **+3 pts** bonus for getting the **8 qualifiers right** (top 2 + being the 3rd that qualifies among the top 8) — optional, only computable after the group stage ends.

Lock before the next round of group matches (after June 27 is too late for most qualification predictions).

### 5.4 Knockout prediction
- **Champion / Runner-up / 3rd**: locked at the start of the tournament (already passed — valid prediction for those who joined before June 11; for new users we **block this prediction**, since group-stage matches influence the choice).
- **MVP decision**: since the app launched mid-Cup (June 15), allow champion/runner-up/3rd prediction until the **end of the group stage (June 27)**. Communicate during onboarding.

### 5.5 Teams with special characters
Diacritics (Curaçao, Czechia) and long names (Bosnia & Herzegovina) — need fallbacks for compact layouts on mobile cards. Keep `code` (3 letters) in the `teams` table for tight space.

---

## 6. High-level calendar

| Period | Phase |
|---|---|
| 06-11 → 06-27 | Group stage |
| ~06-29 → 07-03 | Round of 32 |
| ~07-04 → 07-07 | Round of 16 |
| ~07-09 → 07-11 | Quarter-finals |
| 07-14 and 07-15 | Semi-finals |
| 07-18 | Third-place play-off |
| **07-19** | **Final** (MetLife Stadium) |

---

## 7. Sources consulted (2026-06-15)

- FIFA official — Tournament rules: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/groups-how-teams-qualify-tie-breakers
- Wikipedia — 2026 FIFA World Cup draw: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_draw
- Wikipedia — 2026 FIFA World Cup knockout stage: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
- ESPN — Format & tiebreakers: https://www.espn.com/soccer/story/_/id/47108758/2026-fifa-world-cup-format-tiebreakers-fixtures-schedule
- Al Jazeera — Match schedule: https://www.aljazeera.com/sports/2026/6/11/world-cup-2026-full-match-schedule-groups-teams-and-start-times
- worldcuplocaltime.com — Tiebreaker rules: https://worldcuplocaltime.com/world-cup-2026-tiebreaker-rules/

If there's any future divergence, the **official FIFA rule prevails**. Re-validate before the start of each phase of the tournament.
