import type { SupabaseClient, User } from '@supabase/supabase-js'
import { normalizePhoneE164 } from '@/lib/phone'

/**
 * Ensures a row exists in public.profiles for this auth user.
 * Listings and bookings FK to profiles(id), not auth.users — users who signed up
 * before the trigger or without it need this row created on first write.
 *
 * When the user has phone_e164 in user_metadata but the profile has no phone yet,
 * copies it into profiles.phone_e164 (fails if that number is already taken).
 */
export async function ensureUserProfile(supabase: SupabaseClient, user: User) {
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const fromMeta =
    typeof meta?.display_name === 'string' ? meta.display_name.trim() : ''
  const displayName = fromMeta || user.email?.split('@')[0] || 'User'

  const upsertResult = await supabase.from('profiles').upsert(
    { id: user.id, display_name: displayName },
    { onConflict: 'id', ignoreDuplicates: true }
  )
  if (upsertResult.error) {
    return upsertResult
  }

  const phoneFromMeta =
    typeof meta?.phone_e164 === 'string' ? normalizePhoneE164(meta.phone_e164) : ''
  if (!phoneFromMeta) {
    return upsertResult
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('phone_e164')
    .eq('id', user.id)
    .maybeSingle()

  if (existing?.phone_e164?.trim()) {
    return upsertResult
  }

  const updateResult = await supabase
    .from('profiles')
    .update({ phone_e164: phoneFromMeta })
    .eq('id', user.id)
    .is('phone_e164', null)

  if (updateResult.error) {
    return updateResult
  }

  return upsertResult
}
