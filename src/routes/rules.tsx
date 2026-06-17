import {
  Crown,
  Info,
  Loader2,
  Lock,
  Medal,
  Award,
  Calendar,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { FifaLogo } from '@/components/FifaLogo'
import { PageHeader } from '@/components/PageHeader'
import { PositionBadge } from '@/components/PositionBadge'
import { SectionHeader } from '@/components/SectionHeader'
import { useScoringConfig } from '@/hooks/useScoringConfig'
import { cn } from '@/lib/utils'

/**
 * Linha de regra com ícone + label + sublinha de detalhe + pts à direita.
 */
function RuleRow({
  icon,
  title,
  description,
  points,
  highlight,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  points: number
  highlight?: 'gold' | 'silver' | 'bronze' | 'primary'
}) {
  const ptsClass =
    highlight === 'gold'
      ? 'text-gold'
      : highlight === 'silver'
        ? 'text-silver'
        : highlight === 'bronze'
          ? 'text-bronze'
          : 'text-primary'
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        {description && (
          <div className="truncate text-xs text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      <div className="text-right">
        <span className={cn('font-display text-2xl font-black tabular-nums', ptsClass)}>
          {points > 0 ? `+${points}` : points}
        </span>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          pts
        </div>
      </div>
    </li>
  )
}

function RulesCard({ children }: { children: React.ReactNode }) {
  return (
    <ul className="divide-y divide-border/40 rounded-2xl border border-border bg-card/80 px-3 backdrop-blur-sm">
      {children}
    </ul>
  )
}

export function RulesPage() {
  const cfg = useScoringConfig()

  if (cfg.isPending) {
    return (
      <main className="container flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }
  if (cfg.isError || !cfg.data) {
    return (
      <main className="container py-8 text-center">
        <p className="text-sm text-destructive">
          Erro ao carregar regras: {(cfg.error as Error)?.message ?? '—'}
        </p>
      </main>
    )
  }

  const c = cfg.data
  const matchdayOrdinal =
    c.group_matchday_start === 2
      ? '2ª'
      : c.group_matchday_start === 3
        ? '3ª'
        : `${c.group_matchday_start}ª`

  return (
    <section className="container space-y-6 py-4">
      <PageHeader
        title="Regras"
        subtitle="Como ganhar pontos no bolão"
        backTo="/profile"
        trailing={<FifaLogo size={32} variant="horizontal" />}
      />

      <section className="space-y-3">
        <SectionHeader
          title="Palpite de partida"
          tone="primary"
          icon={<Target className="size-4" />}
        />
        <RulesCard>
          <RuleRow
            icon={<Target className="size-5 text-primary" />}
            title="Placar exato"
            description="Acertou home × away na mosca"
            points={c.match.exact_score}
          />
          <RuleRow
            icon={<Trophy className="size-5 text-muted-foreground" />}
            title="Resultado correto"
            description="Vitória do time certo ou empate"
            points={c.match.correct_result}
          />
          <RuleRow
            icon={<TrendingUp className="size-5 text-muted-foreground" />}
            title="Saldo de gols correto"
            description="Diferença de gols igual ao real"
            points={c.match.correct_goal_diff_bonus}
          />
        </RulesCard>
        <p className="px-3 text-[11px] text-muted-foreground">
          Placar exato substitui resultado + saldo. As outras pontuações somam.
        </p>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Classificação dos grupos"
          tone="primary"
          icon={<Star className="size-4" />}
        />
        <RulesCard>
          <RuleRow
            icon={<span className="font-display text-lg font-black">1º</span>}
            title="1º colocado correto"
            points={c.group.first}
          />
          <RuleRow
            icon={<span className="font-display text-lg font-black">2º</span>}
            title="2º colocado correto"
            points={c.group.second}
          />
          <RuleRow
            icon={<span className="font-display text-lg font-black">3º</span>}
            title="3º colocado correto"
            points={c.group.third}
          />
          <RuleRow
            icon={<span className="font-display text-lg font-black">4º</span>}
            title="4º colocado correto"
            points={c.group.fourth}
          />
          <RuleRow
            icon={<Star className="size-5 text-primary" />}
            title="Bônus 32-avos"
            description="Por cada time correto entre os 32 classificados"
            points={c.group.qualifier_bonus_per_team}
          />
        </RulesCard>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Palpite do torneio"
          tone="gold"
          icon={<Crown className="size-4" />}
        />
        <RulesCard>
          <RuleRow
            icon={<PositionBadge position="gold" variant="icon-only" />}
            title="Campeão"
            points={c.tournament.champion}
            highlight="gold"
          />
          <RuleRow
            icon={<PositionBadge position="silver" variant="icon-only" />}
            title="Vice-campeão"
            points={c.tournament.runner_up}
            highlight="silver"
          />
          <RuleRow
            icon={<PositionBadge position="bronze" variant="icon-only" />}
            title="Terceiro lugar"
            points={c.tournament.third_place}
            highlight="bronze"
          />
        </RulesCard>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Como funciona"
          tone="muted"
          icon={<Info className="size-4" />}
        />
        <div className="space-y-2 rounded-2xl border border-border bg-card/80 p-4 text-sm backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              <strong>Palpites travam {c.lock_minutes} minutos</strong> antes do
              apito inicial. Você pode editar até esse momento.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Medal className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              <strong>Palpite do torneio</strong> pode ser feito ou alterado{' '}
              <strong>até o fim da fase de grupos</strong> (último jogo do
              grupo).
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Award className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              <strong>Palpite por grupo</strong> trava{' '}
              {c.lock_minutes} minutos antes do primeiro jogo da{' '}
              <strong>última rodada</strong> daquele grupo (os 2 jogos da MD3
              acontecem ao mesmo tempo, então o lock pega ambos).
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              <strong>Pontuação começa na {matchdayOrdinal} rodada</strong> da
              fase de grupos. Os jogos da 1ª rodada acontecem antes do bolão
              valer pra todos (regra de equidade — o app entrou no ar com a
              Copa em andamento).
            </p>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              <strong>Ranking</strong> atualiza automaticamente assim que cada
              partida termina.
            </p>
          </div>
        </div>
      </section>
    </section>
  )
}
