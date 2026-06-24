import { useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import {
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Ticket,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/PageHeader'
import { SectionHeader } from '@/components/SectionHeader'
import {
  randomInviteCode,
  useCreateInvite,
  useDeleteInvite,
  useInvites,
} from '@/hooks/useInvites'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { enUS, ptBR } from 'date-fns/locale'
import type { Invite } from '@/types/db'

type MaxUsesOption = 1 | 5 | 10 | 25 | null
type ExpiresOption = 'never' | '7' | '30' | '90'

type StatusTone = 'primary' | 'destructive' | 'muted' | 'gold'
type StatusKey = 'active' | 'inUse' | 'expired' | 'exhausted'

interface InviteStatus {
  key: StatusKey
  tone: StatusTone
}

function statusOf(invite: Invite): InviteStatus {
  if (invite.expires_at && new Date(invite.expires_at) <= new Date()) {
    return { key: 'expired', tone: 'destructive' }
  }
  if (invite.max_uses != null && invite.uses_count >= invite.max_uses) {
    return { key: 'exhausted', tone: 'muted' }
  }
  if (invite.uses_count > 0) {
    return { key: 'inUse', tone: 'gold' }
  }
  return { key: 'active', tone: 'primary' }
}

function inviteUrl(code: string): string {
  return `${window.location.origin}/login?invite=${encodeURIComponent(code)}`
}

export function InvitesPage() {
  const isAdmin = useIsAdmin()
  const invites = useInvites()
  const create = useCreateInvite()
  const remove = useDeleteInvite()
  const { t } = useTranslation('invites')

  const [code, setCode] = useState(() => randomInviteCode())
  const [description, setDescription] = useState('')
  const [maxUses, setMaxUses] = useState<MaxUsesOption>(null)
  const [expires, setExpires] = useState<ExpiresOption>('never')
  const [createError, setCreateError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  if (isAdmin === undefined) {
    return (
      <main className="container flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  function expiresIsoFromOption(opt: ExpiresOption): string | null {
    if (opt === 'never') return null
    const days = Number(opt)
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString()
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreateError(null)
    const trimmedCode = code.trim().toLowerCase()
    if (trimmedCode.length < 4) {
      setCreateError(t('create.codeTooShort'))
      return
    }
    try {
      await create.mutateAsync({
        code: trimmedCode,
        description: description.trim() || undefined,
        max_uses: maxUses,
        expires_at: expiresIsoFromOption(expires),
      })
      // reset
      setCode(randomInviteCode())
      setDescription('')
      setMaxUses(null)
      setExpires('never')
    } catch (err) {
      setCreateError((err as Error).message)
    }
  }

  async function handleCopy(c: string) {
    try {
      await navigator.clipboard.writeText(inviteUrl(c))
      setCopied(c)
      setTimeout(() => setCopied((cur) => (cur === c ? null : cur)), 1800)
    } catch {
      // navegadores antigos: fallback ignorado
    }
  }

  async function handleDelete(c: string) {
    const ok = window.confirm(t('list.deleteConfirm', { code: c }))
    if (!ok) return
    await remove.mutateAsync(c)
  }

  return (
    <section className="container space-y-4 py-4">
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        backTo="/profile"
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Shield className="size-3" />
            {t('adminBadge')}
          </span>
        }
      />

      {/* Formulário de criação */}
      <section className="space-y-3">
        <SectionHeader
          title={t('create.section')}
          tone="primary"
          icon={<Plus className="size-4" />}
        />
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-sm"
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('create.codeLabel')}
            </label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toLowerCase().replace(/\s+/g, ''))
                }
                placeholder={t('create.codePlaceholder')}
                maxLength={40}
                className="font-mono"
                autoCapitalize="none"
              />
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setCode(randomInviteCode())}
                aria-label={t('create.randomAria')}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t('create.urlPreview')}{' '}
              <code className="font-mono">/login?invite={code}</code>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('create.descLabel')}
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('create.descPlaceholder')}
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('create.maxUsesLabel')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {([1, 5, 10, 25, null] as MaxUsesOption[]).map((opt) => (
                  <button
                    key={opt ?? 'unlimited'}
                    type="button"
                    onClick={() => setMaxUses(opt)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                      maxUses === opt
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {opt === null ? t('list.unlimited') : opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('create.expiresLabel')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['never', t('create.expiresNever')],
                    ['7', t('create.expires7d')],
                    ['30', t('create.expires30d')],
                    ['90', t('create.expires90d')],
                  ] as Array<[ExpiresOption, string]>
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setExpires(val)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                      expires === val
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {createError && (
            <p className="text-sm text-destructive" role="alert">
              {createError}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={create.isPending}>
            {create.isPending ? (
              <>
                <Loader2 className="animate-spin" /> {t('create.submitting')}
              </>
            ) : (
              <>
                <Plus className="size-4" /> {t('create.submit')}
              </>
            )}
          </Button>
        </form>
      </section>

      {/* Lista */}
      <section className="space-y-3">
        <SectionHeader
          title={t('list.section')}
          tone="muted"
          icon={<Ticket className="size-4" />}
          trailing={
            invites.data
              ? t('list.totalCount', { count: invites.data.length })
              : undefined
          }
        />
        {invites.isPending ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : invites.data?.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            {t('list.empty')}
          </p>
        ) : (
          <ul className="space-y-2">
            {invites.data?.map((inv) => (
              <InviteRow
                key={inv.code}
                invite={inv}
                copied={copied === inv.code}
                onCopy={() => handleCopy(inv.code)}
                onDelete={() => handleDelete(inv.code)}
                deleting={remove.isPending}
              />
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

interface InviteRowProps {
  invite: Invite
  copied: boolean
  onCopy: () => void
  onDelete: () => void
  deleting: boolean
}

function InviteRow({ invite, copied, onCopy, onDelete, deleting }: InviteRowProps) {
  const { t, i18n } = useTranslation('invites')
  const status = statusOf(invite)
  const locale = i18n.language?.startsWith('en') ? enUS : ptBR
  const expiresLabel = useMemo(() => {
    if (!invite.expires_at) return null
    return format(new Date(invite.expires_at), 'dd/MM/yy', { locale })
  }, [invite.expires_at, locale])

  return (
    <li className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-3 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm font-bold">{invite.code}</code>
            <StatusPill status={status} />
          </div>
          {invite.description && (
            <p className="truncate text-xs text-muted-foreground">
              {invite.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>
              {t('list.usesOfMax', {
                used: invite.uses_count,
                max: invite.max_uses ?? t('list.unlimited'),
              })}
            </span>
            {expiresLabel && (
              <>
                <span aria-hidden>·</span>
                <span>{t('list.expiresAt', { date: expiresLabel })}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onCopy}
            aria-label={t('list.copyAria', { code: invite.code })}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
              copied
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card hover:bg-accent',
            )}
          >
            {copied ? (
              <>
                <CheckCircle2 className="size-3" /> {t('list.copied')}
              </>
            ) : (
              <>
                <Copy className="size-3" /> {t('list.copyLink')}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label={t('list.deleteAria', { code: invite.code })}
            className="grid size-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </li>
  )
}

function StatusPill({ status }: { status: InviteStatus }) {
  const { t } = useTranslation('invites')
  const cls =
    status.tone === 'primary'
      ? 'bg-primary/10 text-primary'
      : status.tone === 'destructive'
        ? 'bg-destructive/10 text-destructive'
        : status.tone === 'gold'
          ? 'bg-gold/10 text-gold'
          : 'bg-muted text-muted-foreground'
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        cls,
      )}
    >
      {t(`status.${status.key}`)}
    </span>
  )
}
