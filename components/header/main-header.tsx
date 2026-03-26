'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const MainHeader = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())

  useEffect(() => {
    if (!configured) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [configured])

  const handleSignOut = async () => {
    if (!configured) return
    const supabase = createClient()
    await supabase.auth.signOut()
    setEmail(null)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="flex h-20 items-center justify-between border-b border-[var(--foreground)]/10 px-4 py-2 md:px-8">
      <Link href="/" className="text-xl font-semibold hover:opacity-90">
        Basa Lagbe
      </Link>
      <nav className="flex items-center gap-2 md:gap-4">
        {configured && (
          <>
            <Link
              href="/dashboard"
              className="text-sm text-(--foreground)/80 hover:underline"
            >
              Dashboard
            </Link>
            {email ? (
              <>
                <span className="hidden max-w-[140px] truncate text-xs text-(--foreground)/60 md:inline">
                  {email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded border border-(--foreground)/20 px-3 py-1.5 text-sm hover:bg-(--foreground)/10"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="rounded border border-(--foreground)/20 px-3 py-1.5 text-sm hover:bg-(--foreground)/10"
              >
                Sign in
              </Link>
            )}
          </>
        )}
        <Link
          href="/list-your-house"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
          aria-label="List your house"
        >
          +
        </Link>
      </nav>
    </header>
  )
}
