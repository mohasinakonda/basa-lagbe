/** Minimal normalization: trim spaces; ensure leading + for E.164-style numbers. */
export function normalizePhoneE164(raw: string): string {
  const s = raw.replace(/\s/g, '').trim()
  if (!s) return s
  if (s.startsWith('+')) return s
  if (s.startsWith('00')) return `+${s.slice(2)}`
  return `+${s}`
}
