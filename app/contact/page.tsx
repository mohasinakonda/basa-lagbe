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
      <h1 className="text-2xl font-semibold">Contact us</h1>
      <p className="mt-4 text-(--foreground)/80">
        Questions about listings, bookings, or your account? We are happy to help.
      </p>

      <section className="mt-8 space-y-4 rounded border border-(--foreground)/15 p-6">
        {contactEmail ? (
          <>
            <p className="text-sm text-(--foreground)/70">Email us directly:</p>
            <a
              href={`mailto:${contactEmail}`}
              className="inline-block text-lg font-medium text-foreground underline decoration-(--foreground)/30 underline-offset-4 hover:decoration-foreground"
            >
              {contactEmail}
            </a>
          </>
        ) : (
          <p className="text-sm text-(--foreground)/75">
            Set <code className="rounded bg-(--foreground)/10 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_CONTACT_EMAIL</code>{' '}
            in your environment to show a support address here. Until then, use the in-app flows for
            listings and bookings.
          </p>
        )}
      </section>

      <p className="mt-8 text-sm text-(--foreground)/65">
        <Link href="/" className="underline hover:text-foreground">
          Back to home
        </Link>
      </p>
    </main>
  )
}
