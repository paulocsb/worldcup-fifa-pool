import { NavLink } from 'react-router-dom'
import { BarChart3, Calendar, Home, Trophy, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type NavItem = {
  to: string
  labelKey: string
  icon: typeof Home
  end?: boolean
}

const items: NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/matches', labelKey: 'nav.matches', icon: Calendar },
  { to: '/standings', labelKey: 'nav.standings', icon: BarChart3 },
  { to: '/ranking', labelKey: 'nav.ranking', icon: Trophy },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
]

export function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="safe-bottom shrink-0 border-t border-border/60 bg-card/90 backdrop-blur-2xl">
      <ul className="container grid grid-cols-5 gap-0.5 px-1 py-1.5">
        {items.map(({ to, labelKey, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  'active:scale-95',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden
                      className="animate-float-in absolute inset-x-4 -top-px h-0.5 rounded-b-full bg-primary"
                    />
                  )}
                  <Icon
                    className={cn(
                      'size-5 transition-transform duration-200',
                      isActive && 'scale-110',
                    )}
                  />
                  <span>{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
