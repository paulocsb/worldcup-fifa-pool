/**
 * Persistência local do convite + flag de "returning user".
 *
 * Por que: o PWA é instalado com `start_url='/'` (sem invite na URL). Quando
 * o usuário abre o app instalado, /login não tem `?invite=` — sem isso ele
 * veria "Bolão privado" e ficaria preso.
 *
 * Solução:
 *   1. Ao validar com sucesso um `?invite=` da URL, salva em localStorage.
 *   2. /login sem invite na URL lê de localStorage como fallback.
 *   3. Após o primeiro auth bem-sucedido, marca `returning-user=true` —
 *      a partir daí o usuário já tem profile e o trigger do DB não bloqueia
 *      mais o login. O gate de UI pode passar sem invite válido.
 */

const KEY_INVITE = 'fifa-bolao:invite'
const KEY_RETURNING = 'fifa-bolao:returning-user'

export function readStoredInvite(): string | null {
  try {
    return window.localStorage.getItem(KEY_INVITE)
  } catch {
    return null
  }
}

export function storeInvite(code: string) {
  try {
    window.localStorage.setItem(KEY_INVITE, code)
  } catch {
    /* localStorage cheia ou bloqueada — ignora */
  }
}

export function isReturningUser(): boolean {
  try {
    return window.localStorage.getItem(KEY_RETURNING) === 'true'
  } catch {
    return false
  }
}

export function markAsReturningUser() {
  try {
    window.localStorage.setItem(KEY_RETURNING, 'true')
  } catch {
    /* ignora */
  }
}
