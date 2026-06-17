/**
 * DiceBear avatars via API HTTP (sem dep do bundle).
 * Doc: https://www.dicebear.com/styles
 */

export const AVATAR_STYLE = 'croodles' as const
export type AvatarStyle =
  | typeof AVATAR_STYLE
  | 'croodles-neutral'
  | 'fun-emoji'
  | 'bottts'
  | 'thumbs'
  | 'lorelei'

const BASE = 'https://api.dicebear.com/9.x'

export function avatarUrl(
  seed: string,
  style: AvatarStyle = AVATAR_STYLE,
  size = 96,
): string {
  const params = new URLSearchParams({
    seed,
    size: String(size),
    backgroundType: 'solid',
    backgroundColor: 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,c4f1be',
  })
  return `${BASE}/${style}/svg?${params.toString()}`
}

export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10)
}
