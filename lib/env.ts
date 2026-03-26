export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  )
}

export function isTwilioVerifyConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_VERIFY_SERVICE_SID?.trim()
  )
}

/** Twilio returns 404 if VERIFY_SERVICE_SID is wrong type (e.g. Messaging MG...) or another account. */
export function getTwilioVerifyEnvIssue(): string | null {
  const account = process.env.TWILIO_ACCOUNT_SID?.trim()
  const service = process.env.TWILIO_VERIFY_SERVICE_SID?.trim()
  if (!account || !service) return null
  if (!account.startsWith('AC')) {
    return 'TWILIO_ACCOUNT_SID should be your Account SID (starts with AC).'
  }
  if (!service.startsWith('VA')) {
    return (
      'TWILIO_VERIFY_SERVICE_SID must be a Verify Service SID (starts with VA). ' +
      'In Twilio Console: Verify → Services → create/open a service and copy its SID—not Messaging, API Key, or other IDs.'
    )
  }
  return null
}
