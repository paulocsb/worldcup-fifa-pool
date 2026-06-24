import { Link } from 'react-router-dom'
import {
  BookOpen,
  ChevronRight,
  Globe,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sun,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/MetricCard'
import { SectionHeader } from '@/components/SectionHeader'
import { Surface } from '@/components/Surface'
import { signOut, useAuth } from '@/hooks/useAuth'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useProfile } from '@/hooks/useProfile'
import { useTheme } from '@/hooks/useTheme'
import { useUserStats } from '@/hooks/useUserStats'
import { useUpdateLanguage } from '@/hooks/useLanguage'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'
import type { AvatarStyle } from '@/lib/dicebear'
import { cn } from '@/lib/utils'

const themeOptions = [
  { value: 'system' as const, icon: Monitor, i18nKey: 'theme.system' },
  { value: 'light' as const, icon: Sun, i18nKey: 'theme.light' },
  { value: 'dark' as const, icon: Moon, i18nKey: 'theme.dark' },
]

export function ProfilePage() {
  const auth = useAuth()
  const profile = useProfile(auth.session?.user.id)
  const stats = useUserStats(auth.session?.user.id)
  const [theme, setTheme] = useTheme()
  const isAdmin = useIsAdmin()
  const { t, i18n } = useTranslation('profile')
  const updateLanguage = useUpdateLanguage(auth.session?.user.id)

  const accuracy = stats.data?.accuracy ?? 0

  return (
    <section className="container space-y-6 py-4">
      <header className="flex flex-col items-center gap-3 text-center">
        {profile.data && (
          <Avatar
            seed={profile.data.avatar_seed}
            style={profile.data.avatar_style as AvatarStyle}
            size={120}
            className="size-28 ring-4 ring-primary/10"
          />
        )}
        <div>
          <h1 className="font-display text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl">
            {profile.data?.display_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {auth.session?.user.email}
          </p>
        </div>
      </header>

      <section className="space-y-3">
        <SectionHeader title={t('myStats')} tone="primary" />
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            icon={Trophy}
            label={t('stat.points')}
            value={stats.data?.total_points ?? 0}
            hint={t('stat.pointsHint', {
              count: stats.data?.scored_predictions ?? 0,
            })}
          />
          <MetricCard
            icon={Target}
            label={t('stat.exactScores')}
            value={stats.data?.exact_scores ?? 0}
            hint={t('stat.exactHint')}
          />
          <MetricCard
            icon={TrendingUp}
            label={t('stat.best')}
            value={`${stats.data?.best_score ?? 0} ${t('pts', { ns: 'ranking' })}`}
            hint={t('stat.bestHint')}
          />
          <MetricCard
            icon={Trophy}
            label={t('stat.totalPredictions')}
            value={stats.data?.total_predictions ?? 0}
            hint={t('stat.predictionsHint', { accuracy })}
            to="/me/predictions"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t('appearance')} tone="muted" />
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/60 bg-card/80 p-1.5 backdrop-blur-sm">
          {themeOptions.map((opt) => {
            const Icon = opt.icon
            const active = theme === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                aria-pressed={active}
              >
                <Icon className="size-4" />
                {t(opt.i18nKey)}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t('language.label')} tone="muted" />
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-card/80 p-1.5 backdrop-blur-sm">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = i18n.language === lang
            return (
              <button
                key={lang}
                type="button"
                onClick={() =>
                  updateLanguage.mutate(lang as SupportedLanguage)
                }
                disabled={updateLanguage.isPending}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                aria-pressed={active}
              >
                <Globe className="size-4" />
                {t(`language.${lang === 'pt-BR' ? 'ptBR' : 'en'}`)}
              </button>
            )
          })}
        </div>
      </section>

      <Surface variant="card" interactive padding="none">
        <Link
          to="/regras"
          className="flex items-center justify-between gap-3 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {t('rules')}
              </p>
            </div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
      </Surface>

      {isAdmin && (
        <Surface
          variant="tonal"
          accent="accent-gold"
          interactive
          padding="none"
          className="bg-[hsl(var(--accent-c)_/_0.10)]"
        >
          <Link
            to="/invites"
            className="flex items-center justify-between gap-3 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold text-[hsl(141_41%_10%)]">
                <Shield className="size-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gold">
                  {t('admin')}
                </p>
                <p className="text-sm font-semibold">{t('manageInvites')}</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-gold" />
          </Link>
        </Surface>
      )}

      <Button variant="outline" size="lg" className="w-full" onClick={signOut}>
        <LogOut className="size-4" />
        {t('signOut')}
      </Button>
    </section>
  )
}
