import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Basa Lagbe</p>
        <nav className="flex flex-wrap items-center gap-6 text-sm">
          <Link
            href="/contact"
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            Contact us
          </Link>

        </nav>
      </div>
    </footer>
  )
}
