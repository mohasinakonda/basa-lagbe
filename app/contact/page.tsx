import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact us – Basa Lagbe',
  description: 'Get in touch with Basa Lagbe for help, feedback, or partnership questions.',
}

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contact us</h1>
      <p className="mt-4 text-muted-foreground">
        Questions about listings, bookings, or your account? We are happy to help.
      </p>

      <section className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
        {contactEmail ? (
          <>
            <p className="text-sm text-muted-foreground">Email us directly:</p>
            <a
              href={`mailto:${contactEmail}`}
              className="inline-block text-lg font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition hover:decoration-primary"
            >
              {contactEmail}
            </a>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Set{' '}
            <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground">
              NEXT_PUBLIC_CONTACT_EMAIL
            </code>{' '}
            in your environment to show a support address here. Until then, use the in-app flows for
            listings and bookings.
          </p>
        )}
      </section>

      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/" className="font-medium text-foreground underline-offset-2 hover:underline">
          Back to home
        </Link>
      </p>
    </main>
  )
}
