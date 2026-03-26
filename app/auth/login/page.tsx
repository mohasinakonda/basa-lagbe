'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'

function AuthLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next')?.startsWith('/') ? searchParams.get('next')! : '/'

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!configured) {
      setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL to .env.local.')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName.trim() || undefined },
          },
        })
        if (err) throw err
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (err) throw err
      }
      router.push(nextPath)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="mt-6 text-2xl font-semibold">
        {mode === 'signin' ? 'Sign in' : 'Create account'}
      </h1>
      <p className="mt-2 text-sm text-(--foreground)/70">
        {mode === 'signin'
          ? 'Use the email and password you registered with.'
          : 'Sign up to list properties and manage bookings.'}
      </p>

      {!configured && (
        <p className="mt-4 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          Set <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
          <code className="text-xs">.env.local</code>, then restart the dev server.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {mode === 'signup' && (
          <div>
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we show you to hosts?"
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-foreground px-4 py-2 text-background hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-(--foreground)/70">
        {mode === 'signin' ? (
          <>
            No account?{' '}
            <button
              type="button"
              className="font-medium underline"
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              className="font-medium underline"
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </>
  )
}

export default function AuthLoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Link href="/" className="text-sm text-(--foreground)/80 hover:underline">
        ← Back home
      </Link>
      <Suspense fallback={<p className="mt-6 text-(--foreground)/70">Loading…</p>}>
        <AuthLoginForm />
      </Suspense>
    </main>
  )
}
