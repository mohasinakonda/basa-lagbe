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
  phone_e164: string | null
  phone_verified_at: string | null
  listing_creation_blocked_until?: string | null
  listing_creation_block_reason?: string | null
}

export function AccountSettingsPanel() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [nameMsg, setNameMsg] = useState<string | null>(null)
  const [nameBusy, setNameBusy] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [phoneMsg, setPhoneMsg] = useState<string | null>(null)
  const [phoneBusy, setPhoneBusy] = useState(false)
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
        if (p?.phone_e164) setPhoneInput(p.phone_e164)
      }
    } finally {
      setLoading(false)
    }
  }, [configured])

  useEffect(() => {
    void load()
  }, [load])

  const saveDisplayName = async () => {
    setNameMsg(null)
    setNameBusy(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayName }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; profile?: ProfileRow }
      if (!res.ok) throw new Error(j.error ?? 'Could not save')
      if (j.profile) setProfile(j.profile)
      setNameMsg('Saved.')
    } catch (e) {
      setNameMsg(e instanceof Error ? e.message : 'Failed')
    } finally {
      setNameBusy(false)
    }
  }

  const sendCode = async () => {
    setPhoneMsg(null)
    setPhoneBusy(true)
    try {
      const res = await fetch('/api/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneE164: phoneInput }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'Failed to send SMS')
      setPhoneMsg('Check your phone for a verification code.')
    } catch (e) {
      setPhoneMsg(e instanceof Error ? e.message : 'Failed')
    } finally {
      setPhoneBusy(false)
    }
  }

  const verifyCode = async () => {
    setPhoneMsg(null)
    setPhoneBusy(true)
    try {
      const res = await fetch('/api/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneE164: phoneInput, code: codeInput }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'Verification failed')
      setPhoneMsg('Phone verified.')
      setCodeInput('')
      await load()
    } catch (e) {
      setPhoneMsg(e instanceof Error ? e.message : 'Failed')
    } finally {
      setPhoneBusy(false)
    }
  }

  if (!configured) {
    return (
      <p className="text-sm text-(--foreground)/80">
        Connect Supabase (see <code className="text-xs">.env.example</code>) to manage your account.
      </p>
    )
  }

  if (loading) {
    return <p className="text-sm text-(--foreground)/70">Loading…</p>
  }

  const blockUntil = profile?.listing_creation_blocked_until ?? null
  const blockReason = profile?.listing_creation_block_reason ?? null
  const listingBlockActive = Boolean(profile && blockUntil && isListingCreationActiveBlocked(blockUntil))

  return (
    <div className="space-y-8">
      {listingBlockActive && blockUntil && (
        <section
          className="space-y-3 rounded-lg border border-amber-600/50 bg-amber-500/10 p-4 text-(--foreground)"
          role="status"
          aria-live="polite"
        >
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            Listing creation restricted
          </h2>
          <p className="text-sm text-(--foreground)/90">
            An administrator has limited your ability to add new property listings. Other account
            settings below are not affected.
          </p>
          {blockReason?.trim() ? (
            <div className="rounded-md border border-(--foreground)/15 bg-background/80 px-3 py-2 text-sm">
              <span className="font-medium">Why: </span>
              {blockReason.trim()}
            </div>
          ) : null}
          <p className="text-sm">
            <span className="font-medium">Restriction lifts: </span>
            <time dateTime={blockUntil}>{formatListingBlockRelease(blockUntil)}</time>
          </p>
          <p className="text-sm text-(--foreground)/75">
            After that time you can submit listings again from{' '}
            <Link href="/list-your-house" className="underline hover:text-foreground">
              List your house
            </Link>
            .
          </p>
        </section>
      )}

      <section className="space-y-3 rounded border border-(--foreground)/15 p-4">
        <h2 className="text-lg font-medium">Sign-in email</h2>
        <p className="text-sm text-(--foreground)/70">
          {email ?? '—'} (managed in your auth provider; contact support to change.)
        </p>
      </section>

      <section className="space-y-3 rounded border border-(--foreground)/15 p-4">
        <h2 className="text-lg font-medium">Display name</h2>
        <p className="text-sm text-(--foreground)/70">Shown to hosts and guests on bookings.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
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
          <button
            type="button"
            disabled={nameBusy}
            onClick={() => void saveDisplayName()}
            className="rounded bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
        </div>
        {nameMsg && <p className="text-sm text-(--foreground)/80">{nameMsg}</p>}
      </section>

      <section className="space-y-3 rounded border border-(--foreground)/15 p-4">
        <h2 className="text-lg font-medium">Phone verification</h2>
        {profile?.phone_verified_at ? (
          <p className="text-sm text-green-800 dark:text-green-400">
            Verified: <span className="font-mono">{profile.phone_e164}</span>
          </p>
        ) : (
          <>
            <p className="text-sm text-(--foreground)/70">
              Add your mobile number. We send a one-time code via SMS (Twilio Verify must be configured
              on the server).
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="phoneAccount">Phone (E.164, e.g. +8801XXXXXXXXX)</Label>
                <Input
                  id="phoneAccount"
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+8801..."
                />
              </div>
              <button
                type="button"
                disabled={phoneBusy}
                onClick={() => void sendCode()}
                className="rounded border border-(--foreground)/20 px-4 py-2 text-sm hover:bg-(--foreground)/10 disabled:opacity-50"
              >
                Send code
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="codeAccount">Code</Label>
                <Input
                  id="codeAccount"
                  type="text"
                  inputMode="numeric"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="123456"
                />
              </div>
              <button
                type="button"
                disabled={phoneBusy}
                onClick={() => void verifyCode()}
                className="rounded bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          </>
        )}
        {phoneMsg && <p className="text-sm text-(--foreground)/80">{phoneMsg}</p>}
      </section>
    </div>
  )
}
