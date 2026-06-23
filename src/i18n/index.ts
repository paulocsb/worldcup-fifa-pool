/**
 * i18n setup. Two locales: 'pt-BR' (default for the friends-group audience)
 * and 'en'. Detection order: localStorage cache → navigator.language → fallback.
 *
 * When the user is logged in, `useLanguageSync` (in src/hooks/useLanguageSync.ts)
 * overrides the detected locale with the one saved on `profiles.language`,
 * so the choice follows the user across devices.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Namespaces — split by area to keep individual files small. Add new entries
// here when extracting strings from a new screen.
import ptBRCommon from './pt-BR/common.json'
import enCommon from './en/common.json'
import ptBRAuth from './pt-BR/auth.json'
import enAuth from './en/auth.json'
import ptBROnboarding from './pt-BR/onboarding.json'
import enOnboarding from './en/onboarding.json'
import ptBRHome from './pt-BR/home.json'
import enHome from './en/home.json'
import ptBRMatches from './pt-BR/matches.json'
import enMatches from './en/matches.json'
import ptBRProfile from './pt-BR/profile.json'
import enProfile from './en/profile.json'
import ptBRRanking from './pt-BR/ranking.json'
import enRanking from './en/ranking.json'

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'pt-BR'

const resources = {
  'pt-BR': {
    common: ptBRCommon,
    auth: ptBRAuth,
    onboarding: ptBROnboarding,
    home: ptBRHome,
    matches: ptBRMatches,
    profile: ptBRProfile,
    ranking: ptBRRanking,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    onboarding: enOnboarding,
    home: enHome,
    matches: enMatches,
    profile: enProfile,
    ranking: enRanking,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    nonExplicitSupportedLngs: true, // 'pt' resolves to 'pt-BR'
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
  })

export default i18n
