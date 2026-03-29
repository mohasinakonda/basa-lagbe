/** Server-side: compare referrer host to app host from request headers. */
export function referrerToSourceTypeServer(
  referrer: string | null | undefined,
  hostHeader: string | null | undefined
): string {
  if (referrer == null || referrer.trim() === '') return 'direct'
  try {
    const u = new URL(referrer)
    const host = u.hostname.toLowerCase()
    if (host.includes('google.') || host.includes('bing.') || host.includes('duckduckgo.')) {
      return 'search'
    }
    if (
      host.includes('facebook.') ||
      host.includes('fb.') ||
      host.includes('twitter.') ||
      host.includes('t.co') ||
      host.includes('instagram.') ||
      host.includes('linkedin.')
    ) {
      return 'social'
    }
    const appHost = hostHeader?.split(':')[0]?.toLowerCase()
    if (appHost && host === appHost) return 'internal'
    return 'referral'
  } catch {
    return 'direct'
  }
}
