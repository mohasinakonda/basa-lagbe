'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/UI/dropdown-menu'
import { Tooltip } from '@/components/UI/tooltip'
import { ChevronDown } from '@/assets/icons/chevron-down'
import { PlusCircleIcon } from '@/assets/icons/plus-circle'
import headerLogo from '@/assets/logo/header-logo.png'
import smallLogo from '@/assets/logo/small-logo.png'

export const MainHeader = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())

  useEffect(() => {
    if (!configured) return
    const supabase = createClient()
    const getUser = async () => {
      const user = await supabase.auth.getUser()
      setEmail(user.data.user?.email ?? null)
      setDisplayName(user.data.user?.user_metadata?.display_name ?? null)
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
      setDisplayName(session?.user?.user_metadata?.display_name ?? null)
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
    <header className="sticky top-0 z-30 flex h-[4.25rem] shrink-0 items-center justify-between border-b border-border bg-surface px-4 shadow-[0_1px_0_rgb(0_0_0/0.04)] md:px-8">
      <Link
        href="/"
        className="text-lg font-semibold tracking-tight text-primary brightness-100 transition-opacity hover:opacity-80 "
      >
        <picture>
          <source media="(min-width: 768px)" srcSet={headerLogo.src} />
          <img
            src={smallLogo.src}
            alt="Basa Lagbe House Rental Service"
            className="h-8 w-auto max-h-full object-contain object-left md:h-10"
          />
        </picture>
      </Link>
      <nav
        className="flex items-center justify-end gap-1.5 md:gap-2"
        aria-label="Main"
      >
        <Link
          href="/contact"
          className="rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hidden md:block"
        >
          Contact
        </Link>
        {configured && (
          <>
            {email ? (
              <DropdownMenu
                id="account-menu"
                align="end"
                triggerClassName="inline-flex max-w-[min(100vw-8rem,220px)] items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                trigger={
                  <>
                    <span className="truncate">{displayName}</span>
                    <ChevronDown className="shrink-0 opacity-60" />
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
                className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Sign in
              </Link>
            )}
          </>
        )}
        <Tooltip content="List your property" delay={350} placement="bottom">
          <Link
            href="/list-your-house"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="List your house"
          >
            <PlusCircleIcon className="shrink-0" />
          </Link>
        </Tooltip>
      </nav>
    </header>
  )
}
