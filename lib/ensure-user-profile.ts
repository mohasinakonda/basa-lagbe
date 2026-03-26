import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Ensures a row exists in public.profiles for this auth user.
 * Listings and bookings FK to profiles(id), not auth.users — users who signed up
 * before the trigger or without it need this row created on first write.
 */
export async function ensureUserProfile(supabase: SupabaseClient, user: User) {
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const fromMeta =
    typeof meta?.display_name === 'string' ? meta.display_name.trim() : ''
  const displayName = fromMeta || user.email?.split('@')[0] || 'User'

  return supabase.from('profiles').upsert(
    { id: user.id, display_name: displayName },
    { onConflict: 'id', ignoreDuplicates: true }
  )
}
