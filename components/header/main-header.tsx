'use client'

import Link from 'next/link'

export const MainHeader = () => {
  return (
    <header className="flex h-20 items-center justify-between border-b border-[var(--foreground)]/10 px-4 py-2 md:px-8">
      <Link href="/" className="text-xl font-semibold hover:opacity-90">
        Basa Lagbe
      </Link>
      <Link
        href="/list-your-house"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
        aria-label="List your house"
      >
        +
      </Link>
    </header>
  )
}
