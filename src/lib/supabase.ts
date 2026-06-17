import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Faltam VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY — copie .env.example para .env.local e preencha (rode `supabase status` para pegar os valores locais).',
  )
}

/**
 * Cliente sem tipos do schema por enquanto.
 * Quando rodarmos `supabase gen types typescript --local > src/types/db.ts`
 * trocamos para `createClient<Database>(...)` e adicionamos a tipagem forte.
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
