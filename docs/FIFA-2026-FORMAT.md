# FIFA World Cup 2026 — Formato Oficial (referência)

Documento de referência para a implementação do bolão. Fonte primária: regulamento da FIFA + Wikipedia. Conferir contra a página oficial em caso de dúvida: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026

---

## 1. Visão geral

- **Países sede**: Canadá, México e Estados Unidos (16 cidades).
- **Período**: 11 de junho a 19 de julho de 2026.
- **Número de seleções**: **48** (primeira edição expandida; eram 32 desde 1998).
- **Total de partidas**: **104**
  - Fase de grupos: 72
  - Mata-mata: 32 (16 + 8 + 4 + 2 + 1 final + 1 disputa de 3º)
- **Final**: 19/07/2026 — MetLife Stadium, East Rutherford, New Jersey (EUA).
- **Disputa de 3º lugar**: 18/07/2026.

---

## 2. Fase de grupos

### 2.1 Estrutura
- **12 grupos** (A até L), cada um com **4 seleções**.
- Cada equipe joga **3 partidas** (round-robin dentro do grupo).
- **Pontuação**: 3 pts vitória / 1 pt empate / 0 derrota.
- **Período**: 11 a 27 de junho de 2026.

### 2.2 Grupos (resultado do sorteio realizado em 05/12/2025, Washington D.C.)

| Grupo | Pote 1 | Pote 2 | Pote 3 | Pote 4 |
|---|---|---|---|---|
| **A** | México | Coreia do Sul | África do Sul | Tchéquia |
| **B** | Canadá | Suíça | Catar | Bósnia e Herzegovina |
| **C** | Brasil | Marrocos | Escócia | Haiti |
| **D** | EUA | Paraguai | Turquia | Austrália |
| **E** | Alemanha | Equador | Costa do Marfim | Curaçao |
| **F** | Holanda | Japão | Suécia | Tunísia |
| **G** | Bélgica | Egito | Irã | Nova Zelândia |
| **H** | Espanha | Uruguai | Arábia Saudita | Cabo Verde |
| **I** | França | Senegal | Noruega | Iraque |
| **J** | Argentina | Áustria | Argélia | Jordânia |
| **K** | Portugal | Colômbia | Uzbequistão | RD Congo |
| **L** | Inglaterra | Croácia | Gana | Panamá |

> **Nota**: a coluna de potes é referencial (ordem dos potes na época do sorteio); o que vale para o bolão é a composição do grupo, não a ordem.

---

## 3. Classificação para o mata-mata

Avançam à **Rodada de 32-avos** (Round of 32):

- **1º colocado de cada grupo** → 12 vagas
- **2º colocado de cada grupo** → 12 vagas
- **8 melhores 3º colocados** dentre os 12 grupos → 8 vagas

**Total: 32 seleções classificadas. 16 eliminadas na fase de grupos** (4 últimos colocados + 4 terceiros piores).

### 3.1 Critérios de desempate dentro do grupo (ordem oficial)

Quando duas ou mais seleções terminam empatadas em **pontos**, aplicar nesta ordem:

1. **Pontos em confrontos diretos** entre as seleções empatadas (head-to-head).
2. **Saldo de gols em confrontos diretos** entre as empatadas.
3. **Gols marcados em confrontos diretos** entre as empatadas.
4. Se ainda restarem 2+ empatadas após reaplicar 1–3 entre elas, prosseguir:
5. **Saldo de gols** em todas as partidas do grupo.
6. **Gols marcados** em todas as partidas do grupo.
7. **Fair play / conduta** — pontuação por cartões:
   - Cartão amarelo: **−1**
   - 2º amarelo (vermelho indireto): **−3**
   - Vermelho direto: **−4**
   - Amarelo + vermelho direto: **−5**
8. **Ranking FIFA** (edição mais recente publicada antes do início do torneio) — usado como critério final em substituição ao sorteio.

### 3.2 Critérios para ranquear os 8 melhores 3º colocados

Comparação **entre os 12 terceiros** de todos os grupos, nesta ordem:

1. **Pontos** obtidos.
2. **Saldo de gols** em todas as partidas do grupo.
3. **Gols marcados** em todas as partidas do grupo.
4. **Fair play / conduta** (mesma fórmula da seção 3.1).
5. **Ranking FIFA**.

Os 8 primeiros nessa lista avançam; os 4 últimos terceiros estão eliminados.

---

## 4. Mata-mata

### 4.1 Fases
1. **Rodada de 32-avos** (Round of 32) — **NOVA em 2026** — 16 jogos
2. **Oitavas de final** (Round of 16) — 8 jogos
3. **Quartas de final** — 4 jogos
4. **Semifinais** — 2 jogos (14 e 15 de julho)
5. **Disputa de 3º lugar** — 1 jogo (18 de julho)
6. **Final** — 1 jogo (19 de julho, MetLife Stadium)

### 4.2 Regras gerais
- Eliminação simples (single-elimination).
- Empate ao fim dos **90 min** → **30 min de prorrogação** (2x15 min).
- Empate ao fim da prorrogação → **pênaltis**.
- Disputa de 3º lugar segue as mesmas regras.

### 4.3 Estrutura do chaveamento (Round of 32)

O chaveamento é **pré-definido** (não há novo sorteio após a fase de grupos). Os confrontos seguem o regulamento (Anexo C do regulamento da FIFA, com 495 combinações possíveis dependendo de quais grupos cedem os 8 melhores 3ºs).

**Confrontos fixos confirmados**:

| Confronto | Origem |
|---|---|
| Winner C × Runner-up F | Vencedor do grupo C vs 2º do grupo F |
| Winner F × Runner-up C | Vencedor do grupo F vs 2º do grupo C |
| Winner H × Runner-up J | Vencedor do grupo H vs 2º do grupo J |
| Winner J × Runner-up H | Vencedor do grupo J vs 2º do grupo H |
| Runner-up A × Runner-up B | 2º do A vs 2º do B |
| Runner-up E × Runner-up I | 2º do E vs 2º do I |
| Runner-up D × Runner-up G | 2º do D vs 2º do G |
| Runner-up K × Runner-up L | 2º do K vs 2º do L |

**Vencedores dos grupos A, B, D, E, G, I, K, L** enfrentam um dos **8 melhores 3ºs colocados**, com a alocação específica dependendo de **quais grupos** classificaram seus 3ºs (regra do Anexo C).

> **Implicação para o bolão**: o palpite de "campeão" e "top 3" é estável (independe do chaveamento), mas palpites sobre confrontos específicos do mata-mata só fazem sentido após a fase de grupos terminar (27/06).

---

## 5. Implicações para a implementação do bolão

### 5.1 Modelo de dados (`docs/PLAN.md`)
- Tabela `teams` precisa do enum/coluna `group_letter` com valores `A..L`. ✅ já contemplado.
- Tabela `matches` precisa de `stage` com pelo menos: `group`, `round_of_32`, `round_of_16`, `quarter_final`, `semi_final`, `third_place`, `final`. Atualizar enum no `001_init.sql`.
- Tabela `teams` precisa de `fifa_ranking` (int) para implementar desempates.
- Tabela `matches` precisa rastrear cartões para o cálculo de fair play se quisermos pontuar bônus por classificação correta com desempates → **decisão**: para o MVP não calculamos desempates internamente. Confiamos no `position` final retornado pela API-Football, que já aplica todos os critérios.

### 5.2 Palpite de fase de grupos
Por grupo, o usuário palpita a **ordem final dos 4 times**: 1º, 2º, 3º, 4º. O bônus de classificação compara contra a ordem oficial.

- **Atenção**: o palpite de "passou para 32-avos" tem dois componentes:
  - **Top 2 do grupo**: avança garantido.
  - **3º do grupo**: avança **apenas** se estiver entre os 8 melhores 3ºs globalmente.
- Sugestão de UI: ao palpitar a ordem do grupo, mostrar tag "vai para os 32-avos?" no 3º colocado (depende de comparação global).

### 5.3 Pontuação para fase de grupos (revisão do `PLAN.md`)
Em vez de pontos fixos por posição, sugestão refinada:
- **5 pts** por acertar 1º exato
- **5 pts** por acertar 2º exato
- **3 pts** por acertar 3º exato
- **2 pts** por acertar 4º exato
- **+3 pts** bônus se acertar os **8 classificados** (top 2 + ser 3º classificado entre os 8 melhores) — opcional, só calculável após o término da fase de grupos.

Travar antes do início da próxima rodada de jogos do grupo (após 27/06 está tarde demais para a maioria dos palpites de classificação).

### 5.4 Palpite de mata-mata
- **Campeão / Vice / 3º**: travado no início do torneio (já passou, palpite válido para quem entrou antes do dia 11/06; para quem entra agora **bloqueamos esse palpite**, dado que jogos da fase de grupos influenciam).
- **Decisão para o MVP**: como o app está sendo lançado já com a Copa em andamento (15/06), liberar o palpite de campeão/vice/3º até o **fim da fase de grupos (27/06)**. Comunicar no onboarding.

### 5.5 Times com caracteres especiais
Diacríticos (Curaçao, Tchéquia) e nomes longos (Bósnia e Herzegovina) — precisam de fallback para layouts compactos no card mobile. Manter `code` (3 letras) na tabela `teams` para usar quando o espaço apertar.

---

## 6. Calendário macro

| Período | Fase |
|---|---|
| 11/06 → 27/06 | Fase de grupos |
| ~29/06 → 03/07 | Rodada de 32-avos |
| ~04/07 → 07/07 | Oitavas de final |
| ~09/07 → 11/07 | Quartas de final |
| 14/07 e 15/07 | Semifinais |
| 18/07 | Disputa de 3º lugar |
| **19/07** | **Final** (MetLife Stadium) |

---

## 7. Fontes consultadas (2026-06-15)

- FIFA oficial — Tournament rules: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/groups-how-teams-qualify-tie-breakers
- Wikipedia — 2026 FIFA World Cup draw: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_draw
- Wikipedia — 2026 FIFA World Cup knockout stage: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
- ESPN — Format & tiebreakers: https://www.espn.com/soccer/story/_/id/47108758/2026-fifa-world-cup-format-tiebreakers-fixtures-schedule
- Al Jazeera — Match schedule: https://www.aljazeera.com/sports/2026/6/11/world-cup-2026-full-match-schedule-groups-teams-and-start-times
- worldcuplocaltime.com — Tiebreaker rules: https://worldcuplocaltime.com/world-cup-2026-tiebreaker-rules/

Em caso de divergência futura, a **regra oficial do site da FIFA prevalece**. Re-validar antes do início de cada fase do torneio.
