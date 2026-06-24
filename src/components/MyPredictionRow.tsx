import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { MatchWithTeams } from "@/hooks/useMatches";
import type { Prediction, Score } from "@/types/db";
import { useScoringConfig } from "@/hooks/useScoringConfig";
import { kickoffLabel } from "@/lib/format";
import { groupColorToken, phaseColorToken } from "@/lib/groupColors";
import { TeamFlag } from "./TeamFlag";
import { GroupPill } from "./GroupPill";
import { PhasePill } from "./PhasePill";
import { PredictionScoreBadge } from "./PredictionScoreBadge";
import { Surface } from "./Surface";
import { cn } from "@/lib/utils";

interface Props {
  match: MatchWithTeams;
  prediction: Prediction;
  score: Score | null;
}

/**
 * Card da tela /me/predictions. Alinhado ao idioma do MatchCard redesenhado:
 * moldura com borda na cor do grupo/fase (accent), header band tonal, pílula
 * solid à DIREITA e status à ESQUERDA. O corpo equilibra PALPITE × RESULTADO
 * REAL lado a lado (rótulos "Palpite"/"Real"/"Parcial") para a leitura de
 * "acertei?" ser instantânea.
 *
 * Precedência visual da moldura: exato (gold) > ao vivo (vermelho) > accent do
 * grupo/fase (estado comum). Gold/vermelho são cores NOMEADAS; o accent vem do
 * Surface como canais HSL crus — por isso só ativamos o accent do Surface no
 * estado comum, evitando concorrência de bordas.
 *
 * Click → match-detail (card inteiro é Link, sem CTA/footer).
 */
export function MyPredictionRow({ match, prediction, score }: Props) {
  const scoring = useScoringConfig();
  const cutoffMatchday = scoring.data?.group_matchday_start ?? 2;
  const { t } = useTranslation("matches");

  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const isPostponed = match.status === "postponed";
  const showRealScore = isFinished || isLive;
  const points = score?.points ?? null;
  const isExact =
    isFinished &&
    prediction.home_score === match.home_score &&
    prediction.away_score === match.away_score;
  // Matches da fase de grupos antes do cutoff (ex: MD1) não pontuam por design
  const matchdayPreCutoff =
    match.stage === "group" && (match.matchday ?? 1) < cutoffMatchday;
  const isFinishedNotScoring =
    isFinished && points === null && matchdayPreCutoff;

  // Token de cor de identidade (grupo na fase de grupos, senão fase). Só vira
  // accent do Surface no estado comum — exato/live dominam com cores nomeadas.
  const accentToken =
    match.stage === "group"
      ? groupColorToken(match.group_letter)
      : phaseColorToken(match.stage);
  const useAccent = !isExact && !isLive && !!accentToken;

  return (
    <Surface
      as="div"
      variant={useAccent ? "tonal" : "card"}
      accent={useAccent ? (accentToken ?? undefined) : undefined}
      interactive
      padding="none"
      className={cn(
        "block overflow-hidden",
        // Exato e ao vivo sobrescrevem a borda/bg com cores NOMEADAS (vencem o
        // accent do grupo/fase). Caso comum: a borda accent vem do Surface tonal.
        isExact
          ? "border-gold/60 bg-gold/[0.06] hover:border-gold"
          : isLive
            ? "border-destructive/50 bg-destructive/[0.04] hover:border-destructive/70"
            : undefined,
      )}
    >
      <Link to={`/matches/${match.id}`} className="block">
        {/* Header: status à ESQUERDA, pílula de identidade à DIREITA (solid).
            Band NEUTRA (bg-muted/40): a identidade do grupo/fase já vem da
            BORDA accent do card + da pílula solid. Tom neutro evita conflito
            entre os pontos coloridos (verde/gold) e grupos vermelhos/coral. */}
        <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-2">
          <StatusIndicator
            score={score}
            isExact={isExact}
            isLive={isLive}
            isPostponed={isPostponed}
            postponedShort={match.live_status_short}
            isFinishedNotScoring={isFinishedNotScoring}
          />
          <div className="shrink-0">
            {match.group_letter ? (
              <GroupPill letter={match.group_letter} variant="solid" size="sm" />
            ) : (
              <PhasePill stage={match.stage} variant="solid" size="sm" />
            )}
          </div>
        </div>

        {/* Corpo: times empurrados para as BORDAS (casa à esquerda, visitante à
            direita) para usar a largura de forma simétrica; o bloco central de
            comparação (palpite × real) fica verdadeiramente centralizado. */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pb-3 pt-1">
          {/* Casa: CÓDIGO na borda externa (esq), bandeira pro centro — mesma
              ordem do MatchCard (código fora, bandeira dentro). */}
          <div className="flex min-w-0 items-center justify-start gap-2">
            <span className="font-display truncate text-base font-bold uppercase tracking-tight">
              {match.home_team?.code ?? "—"}
            </span>
            <TeamFlag team={match.home_team} size={28} />
          </div>

          {/* Bloco central de comparação. Quando há placar (real/parcial) usa um
              GRID de 2 colunas (rótulo | placar): a coluna 1 assume a largura do
              rótulo mais largo, então os placares (coluna 2) começam no MESMO x
              nas duas linhas e empilham alinhados. tabular-nums garante dígitos
              de mesma largura para "2−1" cair sobre "1−0". Quando é só texto
              (início/aviso) trata como sub-linha fora do grid. */}
          <div className="flex flex-col items-center gap-0.5 px-1">
            <div className="grid grid-cols-[auto_auto] items-baseline gap-x-2">
              <ScoreLine
                label={t("myPrediction.guess")}
                home={prediction.home_score}
                away={prediction.away_score}
                tone={isExact ? "gold" : "default"}
                primary
              />
              {showRealScore && (
                <ScoreLine
                  label={isLive ? t("partial") : t("myPrediction.real")}
                  home={match.home_score}
                  away={match.away_score}
                  tone={isLive ? "live" : isExact ? "gold" : "muted"}
                />
              )}
            </div>
            {!showRealScore &&
              (isPostponed ? (
                <span className="text-[11px] font-medium text-amber-500">
                  {match.live_status_short === "SUSP"
                    ? t("suspendedWaiting")
                    : t("postponedWaitingDate")}
                </span>
              ) : (
                <span className="text-center text-[11px] text-muted-foreground">
                  <span className="uppercase tracking-wider">
                    {t("startsAt")}
                  </span>{" "}
                  <span className="font-medium text-foreground/70">
                    {kickoffLabel(match.kickoff_at)}
                  </span>
                </span>
              ))}
          </div>

          {/* Visitante: bandeira pro centro, CÓDIGO na borda externa (dir) —
              espelha o MatchCard (código fora, bandeira dentro). */}
          <div className="flex min-w-0 items-center justify-end gap-2">
            <TeamFlag team={match.away_team} size={28} />
            <span className="font-display truncate text-base font-bold uppercase tracking-tight">
              {match.away_team?.code ?? "—"}
            </span>
          </div>
        </div>
      </Link>
    </Surface>
  );
}

/**
 * Linha rotulada de placar no centro do confronto. Renderiza DUAS células
 * diretas do grid pai (`grid-cols-[auto_auto]`): rótulo na coluna 1, placar na
 * coluna 2. Assim a coluna 1 assume a largura do rótulo mais largo ("Palpite")
 * e os placares (coluna 2) começam no MESMO x — empilhando alinhados.
 *
 * Os dois placares têm o MESMO tamanho de fonte (`text-lg`) e `tabular-nums`,
 * garantindo dígitos de mesma largura para o traço de "2−1" cair exatamente
 * sobre o de "1−0". O palpite (`primary`) destaca-se pelo peso/cor, não pelo
 * tamanho; o real é distinguido pelo rótulo e tom mais discreto. Fragmento sem
 * wrapper para as células participarem diretamente do grid.
 */
function ScoreLine({
  label,
  home,
  away,
  tone,
  primary = false,
}: {
  label: string;
  home: number | null;
  away: number | null;
  tone: "default" | "gold" | "live" | "muted";
  primary?: boolean;
}) {
  return (
    <>
      <span
        className={cn(
          "justify-self-end text-right text-[9px] font-semibold uppercase tracking-wider",
          tone === "live"
            ? "text-destructive/80"
            : tone === "gold"
              ? "text-gold/80"
              : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-display text-lg leading-none tabular-nums",
          primary ? "font-black" : "font-bold",
          tone === "gold"
            ? "text-gold"
            : tone === "live"
              ? "text-destructive"
              : tone === "muted"
                ? "text-foreground/70"
                : "text-foreground",
        )}
      >
        {home ?? "-"}
        <span className="mx-0.5 text-muted-foreground/50">–</span>
        {away ?? "-"}
      </span>
    </>
  );
}

function StatusIndicator({
  score,
  isExact,
  isLive,
  isPostponed,
  postponedShort,
  isFinishedNotScoring,
}: {
  score: Score | null;
  isExact: boolean;
  isLive: boolean;
  isPostponed: boolean;
  postponedShort: string | null;
  isFinishedNotScoring: boolean;
}) {
  const { t } = useTranslation("matches");
  // Ordem de prioridade: ao vivo > adiado/suspenso > pontos > não pontua > aguardando
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
        <span className="relative inline-flex size-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/80" />
          <span className="relative inline-flex size-1.5 rounded-full bg-white" />
        </span>
        {t("myPrediction.live")}
      </span>
    );
  }
  if (isPostponed) {
    const label =
      postponedShort === "SUSP" ? t("status.suspended") : t("status.postponed");
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">
        {label}
      </span>
    );
  }
  if (score !== null) {
    return <PredictionScoreBadge score={score} isExact={isExact} />;
  }
  if (isFinishedNotScoring) {
    return (
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {t("myPrediction.noScoring")}
      </span>
    );
  }
  return (
    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      {t("myPrediction.waiting")}
    </span>
  );
}
