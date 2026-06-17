import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      // Log de debug — sem ação
      if (import.meta.env.DEV) console.info('[PWA] SW registrado em', swUrl)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="safe-bottom fixed bottom-20 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-xl animate-in slide-in-from-bottom-4"
    >
      <div className="flex items-center gap-3">
        <RefreshCw className="size-4 shrink-0 text-primary" />
        <p className="flex-1 text-sm">
          Nova versão disponível. Recarregue para atualizar.
        </p>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95"
        >
          Atualizar
        </button>
        <button
          type="button"
          aria-label="Dispensar"
          onClick={() => setNeedRefresh(false)}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
