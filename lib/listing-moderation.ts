/** True when `listing_creation_blocked_until` is set and still in the future. */
export function isListingCreationActiveBlocked(until: string | null | undefined): boolean {
  if (!until) return false
  const t = new Date(until).getTime()
  return !Number.isNaN(t) && t > Date.now()
}

export function formatListingBlockRelease(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(d)
  } catch {
    return iso
  }
}
