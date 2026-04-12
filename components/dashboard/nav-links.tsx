'use client'
import { cn } from "@/lib/tailwind-merge"
import Link from "next/link"
import { usePathname } from "next/navigation"
export const NavLinks = () => {
  const links = [
    { name: 'Overview', href: '/admin' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Listings', href: '/admin/listings' },
  ]
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href
  return <nav className="flex flex-wrap gap-3 text-sm font-medium">
    {links.map(link => (<Link
      href={link.href}
      key={link.href}
      className={cn("text-muted-foreground underline-offset-4 transition hover:text-foreground", isActive(link.href) && "text-foreground border-b-2 border-b-primary")}>
      {link.name}
    </Link>))}


  </nav>
}