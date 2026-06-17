import { avatarUrl, type AvatarStyle } from '@/lib/dicebear'
import { cn } from '@/lib/utils'

interface AvatarProps {
  seed: string
  style?: AvatarStyle
  size?: number
  className?: string
  alt?: string
}

export function Avatar({
  seed,
  style,
  size = 48,
  className,
  alt = '',
}: AvatarProps) {
  return (
    <img
      src={avatarUrl(seed, style, size)}
      width={size}
      height={size}
      alt={alt}
      className={cn(
        'rounded-full border border-border bg-muted object-cover',
        className,
      )}
      loading="lazy"
    />
  )
}
