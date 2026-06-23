import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isTomorrow,
  isYesterday,
  type Locale,
} from 'date-fns'
import { enUS, ptBR } from 'date-fns/locale'
import i18n from '@/i18n'

/**
 * Returns the active date-fns locale based on i18n's current language.
 * Falls back to pt-BR to match the app default.
 */
function activeLocale(): Locale {
  return i18n.language?.startsWith('en') ? enUS : ptBR
}

/**
 * Returns the active i18n namespace 'common' for "Today"/"Tomorrow"/"Yesterday"
 * strings. Reading via the global i18n instance avoids passing locale into
 * pure helpers that are called from places without a React context.
 */
function t(key: 'today' | 'tomorrow' | 'yesterday'): string {
  return i18n.t(key, { ns: 'common' })
}

export function kickoffLabel(iso: string): string {
  const d = new Date(iso)
  const locale = activeLocale()
  if (isToday(d)) return `${t('today')}, ${format(d, 'HH:mm', { locale })}`
  if (isTomorrow(d))
    return `${t('tomorrow')}, ${format(d, 'HH:mm', { locale })}`
  // pt-BR uses "EEE, dd/MM 'às' HH:mm"; English doesn't need the "às"
  return locale === enUS
    ? format(d, "EEE, MMM d 'at' HH:mm", { locale })
    : format(d, "EEE, dd/MM 'às' HH:mm", { locale })
}

export function shortDate(iso: string): string {
  const locale = activeLocale()
  return locale === enUS
    ? format(new Date(iso), 'MM/dd', { locale })
    : format(new Date(iso), 'dd/MM', { locale })
}

/** Rótulo amigável para cabeçalhos de seção por data */
export function sectionDateLabel(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return t('today')
  if (isTomorrow(d)) return t('tomorrow')
  if (isYesterday(d)) return t('yesterday')
  const locale = activeLocale()
  return locale === enUS
    ? format(d, "EEEE, MMMM d", { locale })
    : format(d, "EEEE, dd 'de' MMMM", { locale })
}

/** Hora curta (HH:mm) usada nos cards quando data já está no header */
export function timeOfDay(iso: string): string {
  return format(new Date(iso), 'HH:mm', { locale: activeLocale() })
}

/** Chave estável YYYY-MM-DD para agrupar (locale-independente) */
export function dateKey(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd')
}

export function timeUntil(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), {
    locale: activeLocale(),
    addSuffix: false,
  })
}
