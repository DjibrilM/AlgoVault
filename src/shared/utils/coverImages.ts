// Glob import all marathon JPG covers in sorted key order so each index maps to a distinct cover
const marathonCoverModules = import.meta.glob<string>(
  '@/assets/images/marathons/covers/marathon-*.jpg',
  { eager: true, query: '?url', import: 'default' }
)

const marathonCoverUrls = Object.keys(marathonCoverModules)
  .sort()
  .map((key) => marathonCoverModules[key])

// Category covers
const categoryCoverModules = import.meta.glob<string>(
  '@/assets/images/categories/covers/*.jpg',
  { eager: true, query: '?url', import: 'default' }
)

/**
 * Returns a unique marathon cover image URL by index (0 to 99+).
 */
export function getMarathonCoverUrl(index: number): string {
  if (marathonCoverUrls.length === 0) return ''
  const safeIdx = Math.abs(index) % marathonCoverUrls.length
  return marathonCoverUrls[safeIdx]
}

/**
 * Returns a dedicated cover image for a category by its ID or name.
 */
export function getCategoryCoverUrl(categoryIdOrName: string): string {
  const normalized = categoryIdOrName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  for (const [pathKey, url] of Object.entries(categoryCoverModules)) {
    if (pathKey.includes(normalized)) {
      return url
    }
  }

  // Fallback to a deterministic marathon cover based on the category/marathon name
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
  }
  return getMarathonCoverUrl(hash)
}
