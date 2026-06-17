import { NavLink } from 'react-router-dom'
import { BarChart3, Calendar, Home, Trophy, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
}

const items: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/matches', label: 'Jogos', icon: Calendar },
  { to: '/standings', label: 'Tabelas', icon: BarChart3 },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/profile', label: 'Perfil', icon: User },
]

export function BottomNav() {
  return (
    <nav className="safe-bottom sticky bottom-0 z-30 border-t border-border/60 bg-card/90 backdrop-blur-2xl">
      <ul className="container grid grid-cols-5 gap-0.5 px-1 py-1.5">
        {items.map(({ to, label, icon: Icon, end }) => (
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
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
