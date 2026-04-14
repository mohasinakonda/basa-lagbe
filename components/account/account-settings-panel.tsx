'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import {
  formatListingBlockRelease,
  isListingCreationActiveBlocked,
} from '@/lib/listing-moderation'

type ProfileRow = {
  id: string
  display_name: string | null
  contact_address?: string | null
  phone_e164: string | null
  listing_creation_blocked_until?: string | null
  listing_creation_block_reason?: string | null
}

export function AccountSettingsPanel() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [contactAddress, setContactAddress] = useState('')
  const [phoneE164, setPhoneE164] = useState('')
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveBusy, setSaveBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const [{ data: auth }, profRes] = await Promise.all([
        supabase.auth.getUser(),
        fetch('/api/profile', { credentials: 'include' }),
      ])
      setEmail(auth.user?.email ?? null)
      if (profRes.ok) {
        const j = (await profRes.json()) as { profile?: ProfileRow }
        const p = j.profile ?? null
        setProfile(p)
        setDisplayName(p?.display_name?.trim() ?? '')
        setContactAddress(p?.contact_address?.trim() ?? '')
        setPhoneE164(p?.phone_e164?.trim() ?? '')
      }
    } finally {
      setLoading(false)
    }
  }, [configured])

  useEffect(() => {
    void load()
  }, [load])

  const saveProfile = async () => {
    setSaveMsg(null)
    setSaveBusy(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayName, contactAddress, phoneE164 }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; profile?: ProfileRow }
      if (!res.ok) throw new Error(j.error ?? 'Could not save')
      if (j.profile) setProfile(j.profile)
      setSaveMsg('Saved.')
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaveBusy(false)
    }
  }

  if (!configured) {
    return (
      <p className="text-sm text-muted-foreground">
        Connect Supabase (see <code className="text-xs">.env.example</code>) to manage your account.
      </p>
    )
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  const blockUntil = profile?.listing_creation_blocked_until ?? null
  const blockReason = profile?.listing_creation_block_reason ?? null
  const listingBlockActive = Boolean(profile && blockUntil && isListingCreationActiveBlocked(blockUntil))

  return (
    <div className="space-y-8">
      {listingBlockActive && blockUntil && (
        <section
          className="space-y-3 rounded-xl border border-amber-600/50 bg-amber-500/10 p-4 text-foreground"
          role="status"
          aria-live="polite"
        >
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            Listing creation restricted
          </h2>
          <p className="text-sm text-muted-foreground">
            An administrator has limited your ability to add new property listings. Other account
            settings below are not affected.
          </p>
          {blockReason?.trim() ? (
            <div className="rounded-md border border-border bg-background/80 px-3 py-2 text-sm">
              <span className="font-medium">Why: </span>
              {blockReason.trim()}
            </div>
          ) : null}
          <p className="text-sm">
            <span className="font-medium">Restriction lifts: </span>
            <time dateTime={blockUntil}>{formatListingBlockRelease(blockUntil)}</time>
          </p>
          <p className="text-sm text-muted-foreground">
            After that time you can submit listings again from{' '}
            <Link href="/list-your-house" className="underline hover:text-foreground">
              List your house
            </Link>
            .
          </p>
        </section>
      )}

      <section className="space-y-3 rounded border border-border p-4">
        <h2 className="text-lg font-medium">Sign-in email</h2>
        <p className="text-sm text-muted-foreground">
          {email ?? '—'}
        </p>
      </section>

      <section className="space-y-3 rounded border border-border p-4">
        <h2 className="text-lg font-medium">Display name</h2>
        <p className="text-sm text-muted-foreground">Shown to hosts and guests on bookings.</p>
        <div>
          <Label htmlFor="displayName">Name</Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
      </section>

      <section className="space-y-3 rounded border border-border p-4">
        <h2 className="text-lg font-medium">Your address</h2>
        <p className="text-sm text-muted-foreground">
          Optional. Hosts see this when you request a booking so they know how to reach you.
        </p>
        <div>
          <Label htmlFor="contactAddress">Address</Label>
          <textarea
            id="contactAddress"
            rows={3}
            value={contactAddress}
            onChange={(e) => setContactAddress(e.target.value)}
            placeholder="Area, city, etc."
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-border"
          />
        </div>
      </section>

      <section className="space-y-3 rounded border border-border p-4">
        <h2 className="text-lg font-medium">Phone</h2>
        <p className="text-sm text-muted-foreground">
          Format (e.g. +8801XXXXXXXXX). Used for host and guest contact on bookings.
        </p>
        <div>
          <Label htmlFor="accountPhone">Mobile number</Label>
          <Input
            id="accountPhone"
            type="tel"
            value={phoneE164}
            onChange={(e) => setPhoneE164(e.target.value)}
            placeholder="+8801..."
            autoComplete="tel"
          />
        </div>
      </section>

      <div className="flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        {saveMsg && <p className="text-sm text-muted-foreground">{saveMsg}</p>}
        <button
          type="button"
          disabled={saveBusy}
          onClick={() => void saveProfile()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-50 sm:ml-auto"
        >
          {saveBusy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
