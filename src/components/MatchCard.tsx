import { Link } from 'react-router-dom'
import { Clock, Lock, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MatchWithTeams } from '@/hooks/useMatches'
import type { Prediction, Score, Team } from '@/types/db'
import { isPredictionOpen, lockTime } from '@/lib/matchLock'
import { groupColorToken, phaseColorToken } from '@/lib/groupColors'
import { useTeamName } from '@/lib/teamI18n'
import { venueLabel } from '@/lib/venueCountry'
import { kickoffLabel, sectionDateLabel, timeOfDay, timeUntil } from '@/lib/format'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/utils'
import { TeamFlag } from './TeamFlag'
import { GroupPill } from './GroupPill'
import { PhasePill } from './PhasePill'
import { MatchStatusBadge } from './MatchStatusBadge'
import { MatchTimer } from './match/MatchTimer'
import { AnimatedScore } from './AnimatedScore'
import { PredictionScoreBadge } from './PredictionScoreBadge'

interface MatchCardProps {
  match: MatchWithTeams
  prediction?: Prediction
  /**
   * Score do palpite do usuário nesta partida (já computado pelo servidor).
   * Quando presente e a partida está encerrada, exibe "+N pts" + coroa de
   * placar exato no footer — fecha o loop emocional no próprio feed.
   */
  score?: Score | null
  onPredict?: (match: MatchWithTeams) => void
  /**
   * Em telas que já agrupam jogos por dia (ex.: /matches), o badge exibe só a
   * hora (HH:mm) em vez de "Hoje, 16:00", evitando redundância com o header.
   */
  compactTime?: boolean
  /**
   * Número OFICIAL do jogo (73–104), exibido SÓ no mata-mata (via BracketPhase)
   * para casar com os cards previstos (BracketMatchCard, "Jogo NN"). Quando
   * omitido (home/matches/grupos), o header fica idêntico ao original — sem
   * regressão. Renderizado como rótulo pequeno acima da linha de contexto.
   */
  matchNumber?: number
}

/**
 * Coluna vertical de time no scoreboard — espelha a ScoreboardTeam da
 * match-detail (escudo + código + nome), mas com escudo 44px (não 64px) para
 * caber a 320px ao lado do centro. Compartilhada pelos 3 estados
 * (scheduled/live/finished). Vencedor em destaque; perdedor atenuado.
 */
function ScoreboardTeam({
  team,
  isWinner,
  dimmed,
}: {
  team: Team | null
  isWinner: boolean
  dimmed: boolean
}) {
  const name = useTeamName(team)
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center gap-1.5 text-center transition-opacity',
        dimmed && 'opacity-60',
      )}
    >
      <TeamFlag team={team} size={44} />
      <div className="min-w-0 max-w-full">
        <div
          className={cn(
            'font-display truncate text-base font-black uppercase leading-none tracking-tight',
            isWinner ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {team?.code ?? '—'}
        </div>
        {team && (
          <div className="truncate text-[11px] leading-tight text-muted-foreground">
            {name}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Corpo do card: scoreboard vertical centrado por time, grid [1fr_auto_1fr]
 * como a match-detail. Compartilhado pelos 3 estados — diverge só no centro:
 *
 * - `live`/`finished` → placar real (AnimatedScore, flash de gol só ao vivo),
 *   vencedor em `text-primary`, perdedor atenuado.
 * - agendado (`showScore=false`) → "vs" muted no centro, espelhando exatamente
 *   o estilo da match-detail (jogo agendado). O palpite NÃO fica mais aqui —
 *   migrou para o botão full-width do footer.
 *
 * Pênaltis (Fase 4): mata-mata decidido nas penalidades ganha uma sub-linha
 * "H–A nos pênaltis" abaixo do placar do tempo normal/prorrogação. Só aparece
 * quando ambos os campos de pênaltis são não-nulos.
 */
function Scoreboard({
  match,
  showScore,
  homeWins,
  awayWins,
  live,
  t,
}: {
  match: MatchWithTeams
  showScore: boolean
  homeWins: boolean
  awayWins: boolean
  live: boolean
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const homePens = match.home_score_penalties
  const awayPens = match.away_score_penalties
  const hasPenalties = homePens != null && awayPens != null
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1">
        <ScoreboardTeam
          team={match.home_team}
          isWinner={homeWins}
          dimmed={awayWins}
        />
        {showScore ? (
          <span className="inline-flex items-baseline gap-1 px-1 font-display text-4xl font-black leading-none tracking-tight tabular-nums">
            <AnimatedScore
              value={match.home_score ?? 0}
              flash={live}
              className={homeWins ? 'text-primary' : undefined}
            />
            <span className="text-2xl text-muted-foreground/50">–</span>
            <AnimatedScore
              value={match.away_score ?? 0}
              flash={live}
              className={awayWins ? 'text-primary' : undefined}
            />
          </span>
        ) : (
          <span className="px-2 font-display text-xl font-bold uppercase text-muted-foreground">
            vs
          </span>
        )}
        <ScoreboardTeam
          team={match.away_team}
          isWinner={awayWins}
          dimmed={homeWins}
        />
      </div>

      {/* Sub-linha de pênaltis: vencedor da disputa em destaque (text-primary).
          Compacta e centrada — secundária ao placar do tempo normal acima. */}
      {hasPenalties && (
        <p className="mt-1.5 text-center text-[11px] font-medium text-muted-foreground">
          <span className="tabular-nums text-foreground/80">
            {t('prediction.penalties', { home: homePens, away: awayPens })}
          </span>
        </p>
      )}
    </div>
  )
}

/**
 * Lado de time no corpo HORIZONTAL (agendado): CÓDIGO + bandeira 36px,
 * encostados no centro. `mirror` espelha (bandeira + CÓDIGO) para o visitante.
 * Sem nome completo — a 320px só o código cabe ao lado da caixa de horário.
 */
function ScheduledTeam({ team, mirror }: { team: Team | null; mirror?: boolean }) {
  const name = useTeamName(team)
  const code = (
    <span className="font-display truncate text-lg font-black uppercase leading-none">
      {team?.code ?? '—'}
    </span>
  )
  const flag = <TeamFlag team={team} size={36} />
  return (
    <div
      aria-label={name}
      className={cn(
        'flex min-w-0 items-center gap-2',
        mirror ? 'justify-start' : 'justify-end',
      )}
    >
      {mirror ? (
        <>
          {flag}
          {code}
        </>
      ) : (
        <>
          {code}
          {flag}
        </>
      )}
    </div>
  )
}

/**
 * Corpo HORIZONTAL para jogos sem placar (scheduled/postponed/cancelled):
 * CÓDIGO + bandeira | caixa de horário (borda na cor cheia do accent) | bandeira
 * + CÓDIGO. A caixa central mostra a hora do kickoff (HH:mm) ou "—" se inválida.
 * Replica o layout aprovado no /card-lab (MatchCardScheduledNext).
 */
function ScheduledBody({
  match,
  hasAccent,
}: {
  match: MatchWithTeams
  hasAccent: boolean
}) {
  const ts = Date.parse(match.kickoff_at)
  const time = Number.isNaN(ts) ? '—' : timeOfDay(match.kickoff_at)
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3">
      <ScheduledTeam team={match.home_team} />
      {/* Caixa de horário — borda na cor CHEIA do accent (sem /opacity, gotcha-safe). */}
      <div
        className={cn(
          'rounded-xl border-2 px-3 py-1.5',
          hasAccent ? 'border-[hsl(var(--accent-c))]' : 'border-border',
        )}
      >
        <span className="font-display text-xl font-bold tabular-nums">
          {time}
        </span>
      </div>
      <ScheduledTeam team={match.away_team} mirror />
    </div>
  )
}

export function MatchCard({
  match,
  prediction,
  score,
  onPredict,
  compactTime = false,
  matchNumber,
}: MatchCardProps) {
  const { t } = useTranslation('matches')

  // Countdown do lock: ativamos o relógio compartilhado só nos cards na janela
  // de <60min até o lock (kickoff − 5min). Fora dela, useNow(false) não se
  // inscreve no tick — sem custo de re-render.
  const lockAt = lockTime(match)
  const COUNTDOWN_WINDOW_MS = 60 * 60_000
  const inCountdownWindow =
    match.status === 'scheduled' &&
    lockAt.getTime() - Date.now() < COUNTDOWN_WINDOW_MS
  const now = useNow(inCountdownWindow)

  // `open` re-avaliado contra o `now` reativo: quando o card está na janela e o
  // lock cruza, o footer transiciona de countdown → "Encerrado" sem reload.
  const open = isPredictionOpen(match, new Date(now))
  const msToLock = lockAt.getTime() - now
  const showCountdown = inCountdownWindow && open && msToLock > 0
  const showScore = match.status === 'finished' || match.status === 'live'
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const isPostponedOrCancelled =
    match.status === 'postponed' || match.status === 'cancelled'
  // Linha de contexto (header-left no agendado): data (omitida quando compactTime,
  // pois /matches já agrupa por dia) + local, juntados por " · ". Sem horário —
  // ele vai na caixa central do corpo.
  const contextLine = [
    compactTime ? '' : sectionDateLabel(match.kickoff_at),
    venueLabel(match.venue, match.venue_city),
  ]
    .filter(Boolean)
    .join(' · ')
  // Placar exato: palpite === resultado real (mesma regra da MyPredictionRow).
  const isExact =
    isFinished &&
    !!prediction &&
    prediction.home_score === match.home_score &&
    prediction.away_score === match.away_score
  const showScoreBadge = isFinished && !!score && !!prediction

  const homeName = useTeamName(match.home_team)
  const awayName = useTeamName(match.away_team)
  // Descritor curto para leitores de tela: "ao vivo", "encerrado" ou horário.
  const statusDescriptor =
    match.status === 'live'
      ? t('status.live').toLowerCase()
      : match.status === 'finished'
        ? t('status.finished').toLowerCase()
        : kickoffLabel(match.kickoff_at)
  const ariaLabel = t('cardAria', {
    home: homeName,
    away: awayName,
    status: statusDescriptor,
  })

  // Token de cor dominante do card: cor do grupo se for fase de grupos, senão a
  // cor da fase. Carregada pelo header band tonal (não há mais faixa lateral —
  // um único indicador de cor evita sinais concorrentes).
  const accentToken =
    match.stage === 'group'
      ? groupColorToken(match.group_letter)
      : phaseColorToken(match.stage)
  // Guardamos os CANAIS HSL crus (ex.: "271 81% 56%") — não o hsl() pronto —
  // para poder aplicar opacidade real via hsl(var(--accent-c) / 0.4). O Tailwind
  // v3 descarta o modificador /opacity em cores arbitrárias com var().
  const accentStyle = accentToken
    ? ({ '--accent-c': `var(--${accentToken})` } as React.CSSProperties)
    : undefined

  const homeScore = match.home_score ?? 0
  const awayScore = match.away_score ?? 0
  // Vencedor real: em mata-mata decidido nos pênaltis o tempo normal
  // (home_score/away_score) costuma estar empatado, então quem vence é quem tem
  // mais pênaltis. Sem pênaltis, decide o placar do tempo normal/prorrogação.
  const homePens = match.home_score_penalties
  const awayPens = match.away_score_penalties
  const decidedByPenalties = homePens != null && awayPens != null
  const homeWins = showScore
    ? decidedByPenalties
      ? homePens > awayPens
      : homeScore > awayScore
    : false
  const awayWins = showScore
    ? decidedByPenalties
      ? awayPens > homePens
      : awayScore > homeScore
    : false

  // Palpite formatado para o footer (botão / chip estático).
  const predictionLabel = prediction
    ? `${prediction.home_score}–${prediction.away_score}`
    : null

  return (
    <article
      style={accentStyle}
      className={cn(
        'animate-float-in relative overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
        // Borda na cor do grupo/fase (identidade visível em repouso, reforçada
        // no hover). Fallback neutro caso não haja accent (não esperado).
        accentStyle
          ? 'border-[hsl(var(--accent-c)_/_0.45)] hover:border-[hsl(var(--accent-c)_/_0.75)]'
          : 'border-border/60',
      )}
    >
      <Link
        to={`/matches/${match.id}`}
        className="block"
        aria-label={ariaLabel}
      >
        {/* Header band tingido pela cor do grupo/fase — único indicador de cor
            do card. À ESQUERDA o contexto varia por estado (MatchTimer ao
            vivo/encerrado; status de adiamento/cancelamento; data·local no
            agendado). À DIREITA, sempre a pílula de identidade (grupo/fase). */}
        <header
          className={cn(
            'flex items-center justify-between gap-2 px-4 py-2.5',
            accentStyle && 'bg-[hsl(var(--accent-c)_/_0.12)]',
          )}
        >
          {/* Header-left: contexto por estado (MatchTimer / status / data·local).
              No mata-mata (matchNumber definido) ganha uma linha "Jogo N" ACIMA
              — espelha o BracketMatchCard ("Jogo 75" + data·local). Em min-w-0
              para truncar a 320px sem empurrar a pílula. */}
          <div className="flex min-w-0 flex-col">
            {matchNumber != null && (
              <span className="min-w-0 truncate font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground tabular-nums">
                {t('matchNumber', { number: matchNumber })}
              </span>
            )}
            {isLive || isFinished ? (
              <MatchTimer match={match} />
            ) : isPostponedOrCancelled ? (
              <MatchStatusBadge match={match} />
            ) : (
              <span className="min-w-0 truncate text-[11px] text-muted-foreground">
                {contextLine}
              </span>
            )}
          </div>
          <div className="shrink-0">
            {match.stage === 'group' && match.group_letter ? (
              <GroupPill letter={match.group_letter} variant="solid" size="sm" />
            ) : (
              <PhasePill stage={match.stage} variant="solid" size="sm" />
            )}
          </div>
        </header>

        {/* Corpo ramificado: sem placar → layout HORIZONTAL com caixa de horário
            central; ao vivo/encerrado → scoreboard VERTICAL (placar, flash,
            pênaltis, vencedor). */}
        {showScore ? (
          <div className="px-4 pt-3">
            <Scoreboard
              match={match}
              showScore={showScore}
              homeWins={homeWins}
              awayWins={awayWins}
              live={isLive}
              t={t}
            />
          </div>
        ) : (
          <ScheduledBody match={match} hasAccent={!!accentStyle} />
        )}
      </Link>

      <footer className="mt-3 px-4 pb-4">
        {/* Countdown do lock: aviso âmbar acionável quando falta <60min para o
            palpite fechar. Âmbar (warning), nunca vermelho — vermelho é
            reservado ao "ao vivo". Acima do botão. aria-live: anunciado. */}
        {showCountdown && (
          <p
            aria-live="polite"
            className="mb-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400"
          >
            <Clock className="size-3 shrink-0" aria-hidden />
            <span>
              {t('prediction.closesIn', {
                time: timeUntil(lockAt, { unit: 'minute' }),
              })}
            </span>
          </p>
        )}

        {/* Ação de palpite full-width no rodapé (tap target ≥44px). Estados:
            - finished + score → PredictionScoreBadge (+N pts / coroa).
            - live → chip estático "Seu palpite: X–Y" (já fechado).
            - agendado + aberto → botão CTA "Palpitar" ou "Seu palpite: X–Y · Editar".
            - agendado + fechado → palpite estático ou "Encerrado" (sem ação). */}
        {showScoreBadge && score ? (
          <div className="flex justify-center">
            <PredictionScoreBadge points={score.points} isExact={isExact} />
          </div>
        ) : isLive ? (
          <FooterStatic
            label={
              predictionLabel
                ? `${t('prediction.yourPrediction')}: ${predictionLabel}`
                : t('prediction.noneLocked')
            }
          />
        ) : open ? (
          <button
            type="button"
            onClick={() => onPredict?.(match)}
            disabled={!onPredict}
            className={cn(
              'inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors active:scale-[0.98] disabled:opacity-60',
              // Já palpitou → tom suave/contornado (sinal de "feito, toque para
              // editar"); ainda não → CTA sólido forte ("palpite agora").
              predictionLabel
                ? 'border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
                : 'bg-primary/90 text-primary-foreground hover:bg-primary',
            )}
          >
            <Pencil className="size-3.5" aria-hidden />
            {predictionLabel
              ? `${t('prediction.yourPrediction')}: ${predictionLabel} · ${t('prediction.edit')}`
              : t('prediction.predict')}
          </button>
        ) : (
          <FooterStatic
            locked
            label={
              predictionLabel
                ? `${t('prediction.yourPrediction')}: ${predictionLabel}`
                : t('prediction.noneLocked')
            }
          />
        )}
      </footer>
    </article>
  )
}

/**
 * Faixa estática full-width no footer (não clicável): palpite fechado (lock) ou
 * ao vivo. Espelha a altura/forma do botão CTA para não causar salto visual.
 * `locked` adiciona o cadeado.
 */
function FooterStatic({ label, locked }: { label: string; locked?: boolean }) {
  return (
    <div className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground">
      {locked && <Lock className="size-3.5 shrink-0" aria-hidden />}
      <span className="truncate font-display tabular-nums">{label}</span>
    </div>
  )
}
