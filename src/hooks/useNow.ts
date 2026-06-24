import { useEffect, useState } from 'react'

/**
 * Relógio compartilhado por toda a app: um único setInterval no módulo,
 * independentemente de quantos componentes consomem. Subscribers são contados
 * por referência; o timer só roda enquanto houver ao menos um inscrito e é
 * limpo quando o último desmonta. Granularidade de 30s basta para contagens
 * em minutos (ex.: countdown de lock de palpite).
 */
const TICK_MS = 30_000

let now = Date.now()
let timer: ReturnType<typeof setInterval> | null = null
const subscribers = new Set<() => void>()

function start() {
  if (timer) return
  timer = setInterval(() => {
    now = Date.now()
    subscribers.forEach((fn) => fn())
  }, TICK_MS)
}

function subscribe(fn: () => void): () => void {
  subscribers.add(fn)
  start()
  return () => {
    subscribers.delete(fn)
    if (subscribers.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

/**
 * Retorna o "agora" em ms, atualizado a cada 30s via relógio compartilhado.
 *
 * @param enabled quando false, não se inscreve no relógio e devolve o último
 *   valor conhecido sem provocar re-renders. Use para que apenas os cards
 *   dentro da janela de countdown participem do tick.
 */
export function useNow(enabled = true): number {
  const [value, setValue] = useState(now)

  useEffect(() => {
    if (!enabled) return
    // Sincroniza imediatamente: o valor do módulo pode estar até 30s atrasado.
    setValue(Date.now())
    return subscribe(() => setValue(now))
  }, [enabled])

  return value
}
