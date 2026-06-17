import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isTomorrow,
  isYesterday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function kickoffLabel(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return `Hoje, ${format(d, 'HH:mm', { locale: ptBR })}`
  if (isTomorrow(d)) return `Amanhã, ${format(d, 'HH:mm', { locale: ptBR })}`
  return format(d, "EEE, dd/MM 'às' HH:mm", { locale: ptBR })
}

export function shortDate(iso: string): string {
  return format(new Date(iso), 'dd/MM', { locale: ptBR })
}

/** Rótulo amigável para cabeçalhos de seção por data */
export function sectionDateLabel(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return 'Hoje'
  if (isTomorrow(d)) return 'Amanhã'
  if (isYesterday(d)) return 'Ontem'
  return format(d, "EEEE, dd 'de' MMMM", { locale: ptBR })
}

/** Hora curta (HH:mm) usada nos cards quando data já está no header */
export function timeOfDay(iso: string): string {
  return format(new Date(iso), 'HH:mm', { locale: ptBR })
}

/** Chave estável YYYY-MM-DD para agrupar */
export function dateKey(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd', { locale: ptBR })
}

export function timeUntil(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), {
    locale: ptBR,
    addSuffix: false,
  })
}
