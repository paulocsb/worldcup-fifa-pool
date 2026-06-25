import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Maximize, Minus, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BRACKET_CANVAS, BracketFullView } from './BracketFullView'
import { PredictionSheet } from '@/components/PredictionSheet'
import { useAuth } from '@/hooks/useAuth'
import { useMyPredictions } from '@/hooks/usePredictions'
import { useBracketNodes, type BracketNodeItem } from '@/hooks/useBracketNodes'
import type { MatchWithTeams } from '@/hooks/useMatches'
import type { Prediction } from '@/types/db'
import { cn } from '@/lib/utils'

const MIN_SCALE = 0.4
const MAX_SCALE = 2.5
/** A pointer movement under this (px) counts as a TAP, not a pan. */
const TAP_THRESHOLD = 8
/** Stepping factor for the +/- buttons. */
const ZOOM_STEP = 1.25
/** Breathing margin so the fitted bracket doesn't touch the viewport edges. */
const FIT_MARGIN = 0.92
/**
 * Smallest scale the initial view is allowed to shrink to. Below this the nodes
 * stop being readable, so we'd rather overflow and let the user pan. Tuned for
 * the bracket's ~14px node text.
 */
const MIN_READABLE = 0.5
/**
 * Ceiling for the initial height-fit upscale. Above natural size (1.0) so the
 * opening view fills more of the vertical space with slightly larger nodes;
 * overflow on either axis is handled by clampPan / the left-start margin.
 */
const MAX_FIT = 1.3
/** Left gutter (px) for the initial view, so the leftmost R32 column breathes. */
const FIT_LEFT_MARGIN = 12
/** Narrow screens get a subtle "rotate for a better view" hint. */
const NARROW_HINT_PX = 380

interface Transform {
  scale: number
  x: number
  y: number
}

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Fullscreen poster-bracket modal with self-contained zoom + pan (Phase 2.3).
 *
 * Gesture engine is hand-rolled on Pointer Events (no extra dependency, keeps
 * the bundle lean and avoids any external-host concern with the CSP):
 *   - 1 pointer drag  → pan (translate), with movement-threshold so a tap that
 *     lands on a node still opens the PredictionSheet.
 *   - 2 pointers      → pinch zoom; scale tracks the finger distance ratio and
 *     zooms toward the gesture midpoint (anchored, so content under the fingers
 *     stays put).
 *   - +/- buttons     → step zoom toward the viewport center.
 *   - fit button      → recompute the FIT transform (whole bracket visible).
 *
 * The transform is a single `translate()scale()` on the canvas; pan is clamped
 * so the bracket can't be lost off-screen. `touch-action: none` on the viewport
 * (only there) lets us own the gestures without fighting the browser.
 */
export function BracketFullModal({ open, onClose }: Props) {
  const { t } = useTranslation('standings')
  const auth = useAuth()
  const nodes = useBracketNodes()
  const predictions = useMyPredictions(auth.session?.user.id)
  const [active, setActive] = useState<MatchWithTeams | null>(null)

  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    x: 0,
    y: 0,
  })
  const transformRef = useRef(transform)
  transformRef.current = transform

  const closeRef = useRef<HTMLButtonElement>(null)

  const predictionByMatch = useMemo(() => {
    const map = new Map<number, Prediction>()
    predictions.data?.forEach((p) => map.set(p.match_id, p))
    return map
  }, [predictions.data])

  // --- FIT: legible initial view, anchored to the start of the bracket. ------
  // The bracket is WIDE and SHORT (contentW >> contentH). A naive fit-ALL would
  // scale to the WIDTH, shrinking nodes into an illegible sliver with a huge
  // vertical void. Instead we fit the HEIGHT (the short axis) so the nodes stay
  // readable, capped at natural size (1.0) and floored at MIN_READABLE; the
  // width is allowed to overflow and the user pans horizontally — the natural
  // way to read a wall-chart bracket.
  //
  // We measure the REAL content size via offsetWidth/Height (intrinsic, ignores
  // the current transform's scale). Returns null until the viewport is laid out
  // (clientW/H === 0), letting the caller retry on the next frame.
  const computeFit = useCallback((): Transform | null => {
    const vp = viewportRef.current
    if (!vp) return null
    const { clientWidth: vw, clientHeight: vh } = vp
    if (vw === 0 || vh === 0) return null

    const content = contentRef.current
    const contentW = content?.offsetWidth || BRACKET_CANVAS.width
    const contentH = content?.offsetHeight || BRACKET_CANVAS.height

    // Fit the SHORT axis (height) for legibility; allow a modest upscale (1.3)
    // so the opening view fills more of the vertical space with bigger nodes.
    const scale = clamp((vh * FIT_MARGIN) / contentH, MIN_READABLE, MAX_FIT)
    const scaledW = contentW * scale
    const scaledH = contentH * scale

    // Horizontal: start at the LEFT (where R32 teams resolve), not centered —
    // unless the whole bracket already fits, then center it.
    const x = scaledW <= vw ? (vw - scaledW) / 2 : FIT_LEFT_MARGIN
    // Vertical: center within the viewport (content is shorter than the area).
    const y = (vh - scaledH) / 2
    return { scale, x, y }
  }, [])

  const clampPan = useCallback((next: Transform): Transform => {
    const vp = viewportRef.current
    if (!vp) return next
    const { clientWidth: vw, clientHeight: vh } = vp
    const content = contentRef.current
    const contentW = content?.offsetWidth || BRACKET_CANVAS.width
    const contentH = content?.offsetHeight || BRACKET_CANVAS.height
    const scaledW = contentW * next.scale
    const scaledH = contentH * next.scale
    // Keep at least a margin of the content on screen; if it's smaller than the
    // viewport on an axis, center it on that axis.
    const x =
      scaledW <= vw
        ? (vw - scaledW) / 2
        : clamp(next.x, vw - scaledW, 0)
    const y =
      scaledH <= vh
        ? (vh - scaledH) / 2
        : clamp(next.y, vh - scaledH, 0)
    return { scale: next.scale, x, y }
  }, [])

  // Apply FIT, retrying on the next frame while the viewport/content aren't
  // measurable yet (modal mount, fonts/flags settling, nodes still loading).
  const applyFit = useCallback(() => {
    let raf = 0
    const attempt = (tries: number) => {
      const fit = computeFit()
      if (fit) {
        setTransform(fit)
      } else if (tries > 0) {
        raf = requestAnimationFrame(() => attempt(tries - 1))
      }
    }
    attempt(10)
    return () => cancelAnimationFrame(raf)
  }, [computeFit])

  // Initialize FIT when the modal opens and once the nodes have rendered (the
  // content box only has its natural size after the tree mounts).
  useLayoutEffect(() => {
    if (!open) return
    return applyFit()
  }, [open, applyFit, nodes.isPending])

  // Body scroll lock while open (don't let the page behind scroll).
  useEffect(() => {
    if (!open) return
    const { body } = document
    const prev = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = prev
    }
  }, [open])

  // ESC to close + focus the close button on open (focus trap entry).
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (active) setActive(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, active])

  // --- Pointer gesture state (refs to avoid re-renders mid-gesture) ---------
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const panStart = useRef<{ x: number; y: number } | null>(null)
  const movedDistance = useRef(0)
  const pinchStart = useRef<{
    dist: number
    scale: number
    midX: number
    midY: number
    originX: number
    originY: number
  } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const vp = viewportRef.current
    if (!vp) return
    vp.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    movedDistance.current = 0

    if (pointers.current.size === 1) {
      panStart.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y,
      }
      pinchStart.current = null
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()]
      const dist = distance(pts[0], pts[1])
      const rect = vp.getBoundingClientRect()
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top
      const tr = transformRef.current
      pinchStart.current = {
        dist,
        scale: tr.scale,
        midX,
        midY,
        // Canvas-space point under the midpoint (stays anchored during zoom).
        originX: (midX - tr.x) / tr.scale,
        originY: (midY - tr.y) / tr.scale,
      }
      panStart.current = null
    }
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return
      const prev = pointers.current.get(e.pointerId)!
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      movedDistance.current += distance(prev, {
        x: e.clientX,
        y: e.clientY,
      })

      if (pointers.current.size >= 2 && pinchStart.current) {
        const pts = [...pointers.current.values()]
        const dist = distance(pts[0], pts[1])
        const ratio = dist / pinchStart.current.dist
        const scale = clamp(
          pinchStart.current.scale * ratio,
          MIN_SCALE,
          MAX_SCALE,
        )
        // Keep the canvas-space origin under the (fixed) start midpoint.
        const x = pinchStart.current.midX - pinchStart.current.originX * scale
        const y = pinchStart.current.midY - pinchStart.current.originY * scale
        setTransform(clampPan({ scale, x, y }))
      } else if (pointers.current.size === 1 && panStart.current) {
        const next = {
          scale: transformRef.current.scale,
          x: e.clientX - panStart.current.x,
          y: e.clientY - panStart.current.y,
        }
        setTransform(clampPan(next))
      }
    },
    [clampPan],
  )

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
    if (pointers.current.size === 0) panStart.current = null
    else if (pointers.current.size === 1) {
      // Resume panning from the remaining finger.
      const [only] = [...pointers.current.values()]
      panStart.current = {
        x: only.x - transformRef.current.x,
        y: only.y - transformRef.current.y,
      }
    }
  }, [])

  const handleSelect = useCallback((item: BracketNodeItem) => {
    // Only treat as a tap if the gesture didn't drift into a pan.
    if (movedDistance.current > TAP_THRESHOLD) return
    if (item.dbMatch) setActive(item.dbMatch)
  }, [])

  // --- Zoom buttons (toward viewport center) --------------------------------
  const zoomBy = useCallback(
    (factor: number) => {
      const vp = viewportRef.current
      if (!vp) return
      const cx = vp.clientWidth / 2
      const cy = vp.clientHeight / 2
      const tr = transformRef.current
      const scale = clamp(tr.scale * factor, MIN_SCALE, MAX_SCALE)
      const originX = (cx - tr.x) / tr.scale
      const originY = (cy - tr.y) / tr.scale
      setTransform(
        clampPan({
          scale,
          x: cx - originX * scale,
          y: cy - originY * scale,
        }),
      )
    },
    [clampPan],
  )

  const isNarrow =
    typeof window !== 'undefined' && window.innerWidth < NARROW_HINT_PX

  if (!open) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('bracket.fullTitle')}
      className="fixed inset-0 z-[60] flex flex-col bg-background"
    >
      {/* Top bar: title + close */}
      <div className="safe-top flex items-center justify-between gap-2 border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur-md">
        <h2 className="font-display text-base font-bold uppercase tracking-wide">
          {t('bracket.fullTitle')}
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t('bracket.close')}
          className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Zoom/pan viewport */}
      <div
        ref={viewportRef}
        className="relative flex-1 touch-none overflow-hidden overscroll-contain"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {nodes.isPending ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            {t('bracket.treeLoading')}
          </div>
        ) : nodes.isError ? (
          <div className="flex h-full items-center justify-center px-6">
            <p className="text-center text-sm text-destructive" role="alert">
              {t('loadError', { message: nodes.error?.message ?? '' })}
            </p>
          </div>
        ) : (
          <div
            ref={contentRef}
            className="absolute left-0 top-0 inline-block origin-top-left will-change-transform"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
          >
            <BracketFullView byRef={nodes.byRef} onSelect={handleSelect} />
          </div>
        )}

        {isNarrow && (
          <p className="pointer-events-none absolute inset-x-0 top-2 mx-auto w-fit rounded-full bg-foreground/70 px-3 py-1 text-[11px] text-background">
            {t('bracket.rotateHint')}
          </p>
        )}
      </div>

      {/* Zoom controls */}
      <div className="safe-bottom pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/60 bg-card/90 p-1 shadow-lg backdrop-blur-md">
          <ZoomButton
            onClick={() => zoomBy(1 / ZOOM_STEP)}
            label={t('bracket.zoomOut')}
          >
            <Minus className="size-5" />
          </ZoomButton>
          <ZoomButton onClick={applyFit} label={t('bracket.zoomFit')}>
            <Maximize className="size-5" />
          </ZoomButton>
          <ZoomButton
            onClick={() => zoomBy(ZOOM_STEP)}
            label={t('bracket.zoomIn')}
          >
            <Plus className="size-5" />
          </ZoomButton>
        </div>
      </div>

      <PredictionSheet
        match={active}
        existing={active ? predictionByMatch.get(active.id) : undefined}
        userId={auth.session?.user.id}
        onClose={() => setActive(null)}
      />
    </div>,
    document.body,
  )
}

function ZoomButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'grid size-11 place-items-center rounded-full text-foreground',
        'transition-colors hover:bg-accent active:scale-95',
      )}
    >
      {children}
    </button>
  )
}

function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
