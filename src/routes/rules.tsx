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
import { useTranslation, Trans } from 'react-i18next'
import { FifaLogo } from '@/components/FifaLogo'
import { PageHeader } from '@/components/PageHeader'
import { PositionBadge } from '@/components/PositionBadge'
import { SectionHeader } from '@/components/SectionHeader'
import { Surface } from '@/components/Surface'
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
  const { t } = useTranslation('rules')
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
          {t('pts')}
        </div>
      </div>
    </li>
  )
}

function RulesCard({ children }: { children: React.ReactNode }) {
  return (
    <ul className="divide-y divide-border/40 rounded-2xl border border-border/60 bg-card/80 px-3 shadow-sm backdrop-blur-sm">
      {children}
    </ul>
  )
}

export function RulesPage() {
  const cfg = useScoringConfig()
  const { t } = useTranslation('rules')

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
          {t('loadError', {
            message: (cfg.error as Error)?.message ?? '—',
          })}
        </p>
      </main>
    )
  }

  const c = cfg.data
  // 2ª / 3ª for pt-BR; ordinal English fallback ("2nd"/"3rd")
  const matchdayOrdinal = (() => {
    const n = c.group_matchday_start
    return n === 2 ? '2ª' : n === 3 ? '3ª' : `${n}ª`
  })()

  return (
    <section className="container space-y-4 py-4">
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        backTo="/profile"
        trailing={<FifaLogo size={32} variant="horizontal" />}
      />

      <section className="space-y-3">
        <SectionHeader
          title={t('match.section')}
          tone="primary"
          icon={<Target className="size-4" />}
        />
        <RulesCard>
          <RuleRow
            icon={<Target className="size-5 text-primary" />}
            title={t('match.exact')}
            description={t('match.exactDesc')}
            points={c.match.exact_score}
          />
          <RuleRow
            icon={<Trophy className="size-5 text-muted-foreground" />}
            title={t('match.result')}
            description={t('match.resultDesc')}
            points={c.match.correct_result}
          />
          <RuleRow
            icon={<TrendingUp className="size-5 text-muted-foreground" />}
            title={t('match.goalDiff')}
            description={t('match.goalDiffDesc')}
            points={c.match.correct_goal_diff_bonus}
          />
        </RulesCard>
        <p className="px-3 text-[11px] text-muted-foreground">
          {t('match.footnote')}
        </p>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title={t('group.section')}
          tone="primary"
          icon={<Star className="size-4" />}
        />
        <RulesCard>
          <RuleRow
            icon={<span className="font-display text-lg font-black">1º</span>}
            title={t('group.first')}
            points={c.group.first}
          />
          <RuleRow
            icon={<span className="font-display text-lg font-black">2º</span>}
            title={t('group.second')}
            points={c.group.second}
          />
          <RuleRow
            icon={<span className="font-display text-lg font-black">3º</span>}
            title={t('group.third')}
            points={c.group.third}
          />
          <RuleRow
            icon={<span className="font-display text-lg font-black">4º</span>}
            title={t('group.fourth')}
            points={c.group.fourth}
          />
          <RuleRow
            icon={<Star className="size-5 text-primary" />}
            title={t('group.qualifierBonus')}
            description={t('group.qualifierBonusDesc')}
            points={c.group.qualifier_bonus_per_team}
          />
        </RulesCard>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title={t('tournament.section')}
          tone="gold"
          icon={<Crown className="size-4" />}
        />
        <RulesCard>
          <RuleRow
            icon={<PositionBadge position="gold" variant="icon-only" />}
            title={t('tournament.champion')}
            points={c.tournament.champion}
            highlight="gold"
          />
          <RuleRow
            icon={<PositionBadge position="silver" variant="icon-only" />}
            title={t('tournament.runnerUp')}
            points={c.tournament.runner_up}
            highlight="silver"
          />
          <RuleRow
            icon={<PositionBadge position="bronze" variant="icon-only" />}
            title={t('tournament.thirdPlace')}
            points={c.tournament.third_place}
            highlight="bronze"
          />
        </RulesCard>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title={t('how.section')}
          tone="muted"
          icon={<Info className="size-4" />}
        />
        <Surface className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              <Trans
                ns="rules"
                i18nKey="how.lockMatch"
                values={{ minutes: c.lock_minutes }}
                components={{ 0: <strong /> }}
              />
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Medal className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              <Trans
                ns="rules"
                i18nKey="how.lockTournament"
                components={{ 0: <strong /> }}
              />
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Award className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              <Trans
                ns="rules"
                i18nKey="how.lockGroup"
                values={{ minutes: c.lock_minutes }}
                components={{ 0: <strong /> }}
              />
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              <Trans
                ns="rules"
                i18nKey="how.scoringStart"
                values={{ matchday: matchdayOrdinal }}
                components={{ 0: <strong /> }}
              />
            </p>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>
              <Trans
                ns="rules"
                i18nKey="how.ranking"
                components={{ 0: <strong /> }}
              />
            </p>
          </div>
        </Surface>
      </section>
    </section>
  )
}
