import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'

/**
 * Keeps i18n's active language in sync with the logged-in user's stored
 * preference (`profiles.language`). Run once at the app root.
 *
 * Behavior:
 *  - Anonymous users: i18n detector resolves via localStorage → navigator.
 *  - Logged-in users: profile.language overrides; persists across devices.
 */
export function useLanguageSync() {
  const { i18n } = useTranslation()
  const auth = useAuth()
  const profile = useProfile(auth.session?.user.id)

  useEffect(() => {
    const desired = profile.data?.language
    if (
      desired &&
      SUPPORTED_LANGUAGES.includes(desired as SupportedLanguage) &&
      desired !== i18n.language
    ) {
      i18n.changeLanguage(desired)
    }
  }, [profile.data?.language, i18n])
}

/**
 * Mutation to update the user's language preference both locally (i18n) and
 * remotely (profile.language).
 */
export function useUpdateLanguage(userId: string | undefined) {
  const { i18n } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lang: SupportedLanguage) => {
      i18n.changeLanguage(lang)
      if (!userId) return
      const { error } = await supabase
        .from('profiles')
        .update({ language: lang })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    },
  })
}
