export interface AvatarOption {
  id: string
  label: string
  src: string
}

const avatarModules = import.meta.glob<string>(
  '@/assets/avatars/*.{jpg,jpeg,png,webp}',
  { eager: true, query: '?url', import: 'default' }
)

function formatAvatarLabel(id: string): string {
  return id
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const AVATARS: AvatarOption[] = Object.entries(avatarModules)
  .map(([filePath, src]) => {
    const fileName = filePath.split('/').pop() ?? ''
    const id = fileName.replace(/\.[^.]+$/, '')
    return {
      id,
      label: formatAvatarLabel(id),
      src,
    }
  })
  .sort((a, b) => a.label.localeCompare(b.label))

const AVATAR_BY_ID = new Map(AVATARS.map((item) => [item.id, item]))

export function getAvatarById(id?: string | null): AvatarOption | undefined {
  if (!id) return AVATARS[0]
  return AVATAR_BY_ID.get(id) ?? AVATARS[0]
}
