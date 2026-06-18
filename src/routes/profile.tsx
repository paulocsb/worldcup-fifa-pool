import { Link } from 'react-router-dom'
import {
  BookOpen,
  ChevronRight,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sun,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/SectionHeader'
import { signOut, useAuth } from '@/hooks/useAuth'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useProfile } from '@/hooks/useProfile'
import { useTheme } from '@/hooks/useTheme'
import { useUserStats } from '@/hooks/useUserStats'
import type { AvatarStyle } from '@/lib/dicebear'
import { cn } from '@/lib/utils'

const themeOptions = [
  { value: 'system' as const, icon: Monitor, label: 'Sistema' },
  { value: 'light' as const, icon: Sun, label: 'Claro' },
  { value: 'dark' as const, icon: Moon, label: 'Escuro' },
]

function StatCard({
  icon,
  label,
  value,
  hint,
  to,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  hint?: string
  /** Se passado, o card vira um Link */
  to?: string
}) {
  const content = (
    <>
      <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
        {to && <ChevronRight className="ml-auto size-3 text-muted-foreground/60" />}
      </div>
      <div className="font-display text-2xl font-bold tabular-nums">
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>
      )}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="block rounded-2xl border border-border/60 bg-card/80 p-3 backdrop-blur-sm transition-colors hover:border-border hover:bg-card active:scale-[0.99]"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-3 backdrop-blur-sm">
      {content}
    </div>
  )
}

export function ProfilePage() {
  const auth = useAuth()
  const profile = useProfile(auth.session?.user.id)
  const stats = useUserStats(auth.session?.user.id)
  const [theme, setTheme] = useTheme()
  const isAdmin = useIsAdmin()

  const accuracy =
    stats.data && stats.data.scored_predictions > 0
      ? Math.round(
          ((stats.data.exact_scores +
            // Considera "acerto" quando ganhou pelo menos os pts de resultado
            (stats.data.scored_predictions - stats.data.exact_scores) * 0.5) /
            stats.data.scored_predictions) *
            100,
        )
      : 0

  return (
    <section className="container space-y-6 py-6">
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
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">
            {profile.data?.display_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {auth.session?.user.email}
          </p>
        </div>
      </header>

      <section className="space-y-3">
        <SectionHeader title="Minhas estatísticas" tone="primary" />
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<Trophy className="size-3.5" />}
            label="Pontos"
            value={stats.data?.total_points ?? 0}
            hint={`${stats.data?.scored_predictions ?? 0} palpites contados`}
          />
          <StatCard
            icon={<Target className="size-3.5" />}
            label="Placar exato"
            value={stats.data?.exact_scores ?? 0}
            hint="palpites cravados"
          />
          <StatCard
            icon={<TrendingUp className="size-3.5" />}
            label="Melhor"
            value={`${stats.data?.best_score ?? 0} pts`}
            hint="em uma partida"
          />
          <StatCard
            icon={<Trophy className="size-3.5" />}
            label="Total palpites"
            value={stats.data?.total_predictions ?? 0}
            hint={`${accuracy}% aproveitamento`}
            to="/me/predictions"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Aparência" tone="muted" />
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-1.5">
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
                {opt.label}
              </button>
            )
          })}
        </div>
      </section>

      <Link
        to="/regras"
        className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Regras
            </p>
            <p className="text-sm font-semibold">Como ganhar pontos</p>
          </div>
        </div>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>

      {isAdmin && (
        <Link
          to="/invites"
          className="flex items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-gold/10 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold text-[hsl(141_41%_10%)]">
              <Shield className="size-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gold">
                Admin
              </p>
              <p className="text-sm font-semibold">Gerenciar convites</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-gold" />
        </Link>
      )}

      <Button variant="outline" size="lg" className="w-full" onClick={signOut}>
        <LogOut className="size-4" />
        Sair
      </Button>
    </section>
  )
}
