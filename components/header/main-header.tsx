'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/UI/dropdown-menu'
import { Tooltip } from '@/components/UI/tooltip'

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const MainHeader = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())

  useEffect(() => {
    if (!configured) return
    const supabase = createClient()
    const getUser = async () => {
      const user = await supabase.auth.getUser()
      setEmail(user.data.user?.email ?? null)
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
    })
    getUser()
    return () => subscription.unsubscribe()
  }, [configured])


  useEffect(() => {
    const fetchProfile = async () => {
      const response = await fetch('/api/profile', { credentials: 'include' })
      if (!response.ok) return
      const user = await response.json()
      setRole(user?.profile?.role ?? null)

    }
    fetchProfile()
  }, [email, configured])

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
      <nav
        className="flex flex-wrap items-center justify-end gap-2 md:gap-3"
        aria-label="Main"
      >
        <Link
          href="/contact"
          className="text-sm font-medium text-foreground hover:underline"
        >
          Contact
        </Link>
        {configured && (
          <>
            {email ? (
              <DropdownMenu
                id="account-menu"
                align="end"
                triggerClassName="inline-flex max-w-[min(100vw-8rem,220px)] items-center gap-1 rounded border border-(--foreground)/20 px-3 py-1.5 text-sm text-(--foreground)/90 hover:bg-(--foreground)/10"
                trigger={
                  <>
                    <span className="truncate">{email}</span>
                    <ChevronDown className="shrink-0 opacity-70" />
                  </>
                }
              >
                <DropdownMenuItem href="/dashboard">Dashboard</DropdownMenuItem>
                {role === 'admin' && <DropdownMenuItem href="/admin">Admin</DropdownMenuItem>}
                <DropdownMenuItem href="/account">Account settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleSignOut()}>Sign out</DropdownMenuItem>
              </DropdownMenu>
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
        <Tooltip content="List your property" delay={350} placement="bottom">
          <Link
            href="/list-your-house"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90"
            aria-label="List your house"
          >
            &#10010;
          </Link>
        </Tooltip>
      </nav>
    </header>
  )
}
