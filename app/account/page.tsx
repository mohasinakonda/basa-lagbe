'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AccountSettingsPanel } from '@/components/account/account-settings-panel'

export default function AccountPage() {
  const router = useRouter()
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())
  const [checked, setChecked] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!configured) {
      queueMicrotask(() => setChecked(true))
      return
    }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user))
      setChecked(true)
      if (!data.user) {
        router.replace('/auth/login?next=/account')
      }
    })
  }, [configured, router])

  if (!configured) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Account</h1>
        <div className="mt-6">
          <AccountSettingsPanel />
        </div>
        <Link href="/" className="mt-6 inline-block text-sm underline">
          Back home
        </Link>
      </main>
    )
  }

  if (!checked || !signedIn) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-(--foreground)/70">Loading…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Account</h1>
        <div className="flex flex-wrap gap-4 text-sm text-(--foreground)/80">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/" className="hover:underline">
            ← Map
          </Link>
        </div>
      </div>
      <p className="text-sm text-(--foreground)/70">
        Update how you appear on the site and verify your phone for bookings.
      </p>
      <AccountSettingsPanel />
    </main>
  )
}
