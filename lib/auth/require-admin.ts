import { NextResponse } from 'next/server'
import type { User, SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured, isSupabaseServiceRoleConfigured } from '@/lib/env'

export type AdminContext = {
  user: User
  admin: SupabaseClient
}

export async function requireAdmin(): Promise<
  { ok: true; ctx: AdminContext } | { ok: false; response: NextResponse }
> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Admin API unavailable' }, { status: 503 }),
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || profile?.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  let admin: SupabaseClient
  try {
    admin = createAdminClient()
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Admin API unavailable' }, { status: 503 }),
    }
  }

  return { ok: true, ctx: { user, admin } }
}
