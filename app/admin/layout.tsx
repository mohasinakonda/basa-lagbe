import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/env'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    redirect('/')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?next=/admin')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-(--foreground)/65">Owner dashboard</p>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm font-medium">
          <Link href="/admin" className="text-(--foreground)/80 underline-offset-4 hover:underline">
            Overview
          </Link>
          <Link href="/admin/users" className="text-(--foreground)/80 underline-offset-4 hover:underline">
            Users
          </Link>
          <Link href="/admin/listings" className="text-(--foreground)/80 underline-offset-4 hover:underline">
            Listings
          </Link>
          <Link href="/" className="text-(--foreground)/55 underline-offset-4 hover:underline">
            ← Site
          </Link>
        </nav>
      </div>
      {children}
    </div>
  )
}
