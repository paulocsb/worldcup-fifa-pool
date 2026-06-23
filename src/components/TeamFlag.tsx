import type { Team } from '@/types/db'
import { useTeamName } from '@/lib/teamI18n'
import { cn } from '@/lib/utils'

interface TeamFlagProps {
  team: Team | null
  /** Diâmetro em px do círculo */
  size?: number
  className?: string
}

const FLAGCDN_PNG_SIZES = [20, 40, 80, 160, 320, 640, 1280] as const

function flagcdnPngUrl(svgUrl: string, target: number): string {
  const need = target * 2 // retina
  const size = FLAGCDN_PNG_SIZES.find((s) => s >= need) ?? 320
  return svgUrl.replace(
    /^(https?:\/\/flagcdn\.com)\/([a-z0-9-]+)\.svg(?:\?.*)?$/i,
    `$1/w${size}/$2.png`,
  )
}

/**
 * Bandeira circular renderizada como background-image num <div> quadrado.
 *
 * Por que NÃO usamos <img>:
 *  - SVGs do flagcdn impõem aspect-ratio intrínseca (3:2) e o object-fit/css
 *    sizing falha em alguns browsers, deixando barras brancas.
 *  - Tailwind preflight aplica `img { max-width:100%; height:auto }` que limita
 *    o crop horizontal correto.
 *
 * Com background-image + background-size: cover sobre uma PNG (raster), o
 * navegador escala a imagem cobrindo TODA a área do div, cortando lateralmente
 * o que ultrapassar — é o comportamento que queremos para o círculo.
 */
export function TeamFlag({ team, size = 32, className }: TeamFlagProps) {
  const name = useTeamName(team)
  const baseClass =
    'shrink-0 rounded-full ring-1 ring-border/60 shadow-sm bg-muted'
  const style: React.CSSProperties = {
    width: size,
    height: size,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  if (!team?.flag_url) {
    return (
      <div
        style={style}
        className={cn(baseClass, className)}
        aria-hidden
      />
    )
  }

  // Converte URL .svg do flagcdn em /w{N}/{code}.png — PNG é estável com cover
  const src = /\.svg(\?|$)/i.test(team.flag_url)
    ? flagcdnPngUrl(team.flag_url, size)
    : team.flag_url

  return (
    <div
      role="img"
      aria-label={name}
      style={{
        ...style,
        backgroundImage: `url("${src}")`,
      }}
      className={cn(baseClass, className)}
    />
  )
}
