import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-(--foreground)/10 bg-(--background)">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <p className="text-sm text-(--foreground)/60">© {new Date().getFullYear()} Basa Lagbe</p>
        <nav className="flex flex-wrap items-center gap-6 text-sm">
          <Link href="/contact" className="font-medium text-foreground hover:underline">
            Contact us
          </Link>
          <Link href="/" className="text-(--foreground)/75 hover:underline">
            Browse homes
          </Link>
        </nav>
      </div>
    </footer>
  )
}
