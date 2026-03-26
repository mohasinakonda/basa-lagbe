'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** `undefined` = loading, `null` = signed out or Supabase not configured */
export function useSupabaseUser() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
      queueMicrotask(() => setUserId(null))
      return
    }

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return userId
}
