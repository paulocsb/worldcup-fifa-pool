import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Cores de grupos e fases (group-a..l, phase-*) listadas em safelist
  // para garantir que classes dinâmicas (bg-group-${letter}) não sejam purgadas.
  safelist: [
    'bg-group-a', 'bg-group-b', 'bg-group-c', 'bg-group-d', 'bg-group-e',
    'bg-group-f', 'bg-group-g', 'bg-group-h', 'bg-group-i', 'bg-group-j',
    'bg-group-k', 'bg-group-l',
    'text-group-a', 'text-group-b', 'text-group-c', 'text-group-d', 'text-group-e',
    'text-group-f', 'text-group-g', 'text-group-h', 'text-group-i', 'text-group-j',
    'text-group-k', 'text-group-l',
    'border-group-a', 'border-group-b', 'border-group-c', 'border-group-d',
    'border-group-e', 'border-group-f', 'border-group-g', 'border-group-h',
    'border-group-i', 'border-group-j', 'border-group-k', 'border-group-l',
    'bg-phase-group', 'bg-phase-r32', 'bg-phase-r16', 'bg-phase-quarter',
    'bg-phase-semi', 'bg-phase-third', 'bg-phase-final',
    'text-phase-group', 'text-phase-r32', 'text-phase-r16', 'text-phase-quarter',
    'text-phase-semi', 'text-phase-third', 'text-phase-final',
    'border-phase-group', 'border-phase-r32', 'border-phase-r16',
    'border-phase-quarter', 'border-phase-semi', 'border-phase-third',
    'border-phase-final',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        gold: {
          DEFAULT: 'hsl(var(--accent-gold))',
          foreground: 'hsl(var(--accent-gold-foreground))',
        },
        silver: { DEFAULT: 'hsl(var(--accent-silver))' },
        bronze: { DEFAULT: 'hsl(var(--accent-bronze))' },
        // Grupos A–L (sistema arco-íris FIFA 2026)
        group: {
          a: 'hsl(var(--group-a))',
          b: 'hsl(var(--group-b))',
          c: 'hsl(var(--group-c))',
          d: 'hsl(var(--group-d))',
          e: 'hsl(var(--group-e))',
          f: 'hsl(var(--group-f))',
          g: 'hsl(var(--group-g))',
          h: 'hsl(var(--group-h))',
          i: 'hsl(var(--group-i))',
          j: 'hsl(var(--group-j))',
          k: 'hsl(var(--group-k))',
          l: 'hsl(var(--group-l))',
        },
        // Fases do torneio
        phase: {
          group: 'hsl(var(--phase-group))',
          r32: 'hsl(var(--phase-r32))',
          r16: 'hsl(var(--phase-r16))',
          quarter: 'hsl(var(--phase-quarter))',
          semi: 'hsl(var(--phase-semi))',
          third: 'hsl(var(--phase-third))',
          final: 'hsl(var(--phase-final))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['"Noto Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: [
          '"Saira Condensed"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'gold-shimmer': {
          '0%, 100%': {
            boxShadow:
              '0 0 0 1px hsl(var(--accent-gold) / 0.3), 0 10px 30px -10px hsl(var(--accent-gold) / 0.45)',
          },
          '50%': {
            boxShadow:
              '0 0 0 2px hsl(var(--accent-gold) / 0.45), 0 14px 40px -8px hsl(var(--accent-gold) / 0.65)',
          },
        },
      },
      animation: {
        'pulse-live': 'pulse-live 1.5s ease-in-out infinite',
        'gold-shimmer': 'gold-shimmer 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
