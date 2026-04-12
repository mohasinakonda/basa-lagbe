'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/UI/dropdown-menu'
import { useSupabaseUser } from '@/lib/hooks/use-supabase-user'
import type { Listing } from '@/types/listing'

export interface ListingDetailSidebarProps {
  listing: Listing | null
  onClose: () => void
  onShare?: (listing: Listing) => void
  isFavorite?: boolean
  onToggleFavorite?: (listingId: string) => void
}

const categoryLabel: Record<Listing['category'], string> = {
  family: 'Family',
  bachelor: 'Bachelor',
  both: 'Family or Bachelor',
}

function IconHeart({ filled, className }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    )
  }
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function IconX({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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

const fieldClass =
  'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring'

export function ListingDetailSidebar({
  listing,
  onClose,
  onShare,
  isFavorite = false,
  onToggleFavorite,
}: ListingDetailSidebarProps) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const userId = useSupabaseUser()
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())

  const [stayStart, setStayStart] = useState('')
  const [stayEnd, setStayEnd] = useState('')
  const [stayMessage, setStayMessage] = useState('')
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingOk, setBookingOk] = useState(false)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)

  useEffect(() => {
    if (listing) closeButtonRef.current?.focus()
  }, [listing])

  useEffect(() => {
    setBookingError(null)
    setBookingOk(false)
    setStayStart('')
    setStayEnd('')
    setStayMessage('')
  }, [listing?.id])

  useEffect(() => {
    if (!listing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [listing, onClose])

  if (!listing) return null

  const photos = listing.photos.length > 0 ? listing.photos : ['https://picsum.photos/seed/placeholder/800/600']
  const currentPhoto = photos[photoIndex] ?? photos[0]
  const expiresLabel = listing.expiresAt
    ? new Date(listing.expiresAt).toLocaleDateString(undefined, {
      dateStyle: 'medium',
    })
    : null

  const canBookRemote =
    supabaseConfigured && listing.ownerId != null && userId != null && userId !== listing.ownerId

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingError(null)
    setBookingOk(false)
    if (!stayStart || !stayEnd) {
      setBookingError('Choose start and end dates.')
      return
    }
    setBookingSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          listingId: listing.id,
          requestedStart: stayStart,
          requestedEnd: stayEnd,
          message: stayMessage.trim() || undefined,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Could not send request')
      setBookingOk(true)
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setBookingSubmitting(false)
    }
  }

  const cardClass = 'rounded-2xl border border-border bg-muted/35 p-4 shadow-sm'

  return (
    <aside
      className="flex h-full w-full max-w-md flex-col border-r border-border bg-surface shadow-dialog md:max-w-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Listing details"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
        <h2 className="truncate pr-2 text-base font-semibold leading-snug text-foreground">
          {listing.title}
        </h2>
        <div className="flex shrink-0 items-center gap-0.5">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(listing.id)}
              className="rounded-full p-2 text-primary transition-colors hover:bg-muted"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <IconHeart
                filled={isFavorite}
                className={`size-6 ${isFavorite ? 'text-primary' : 'text-muted-foreground'}`}
              />
            </button>
          )}
          {onShare && (
            <DropdownMenu
              id={`listing-share-${listing.id}`}
              align="end"
              triggerClassName="inline-flex items-center gap-1 rounded-full px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              trigger={
                <>
                  Share
                  <IconChevronDown className="size-4 opacity-60" />
                </>
              }
            >
              <DropdownMenuItem
                onClick={() => {
                  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}?listing=${listing.id}`
                  void navigator.clipboard?.writeText(url)
                }}
              >
                Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onShare(listing)}>Share via device…</DropdownMenuItem>
            </DropdownMenu>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close details"
          >
            <IconX className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative aspect-video w-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto}
            alt={`${listing.title} photo ${photoIndex + 1}`}
            className="h-full w-full object-cover"
          />
          {photos.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-lg text-white shadow-md backdrop-blur-sm transition hover:bg-black/70"
                onClick={() => setPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
                aria-label="Previous photo"
              >
                &#x276E;
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-lg text-white shadow-md backdrop-blur-sm transition hover:bg-black/70"
                onClick={() => setPhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
                aria-label="Next photo"
              >
                &#x276F;
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`h-2 w-2 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/45 hover:bg-white/70'}`}
                    onClick={() => setPhotoIndex(i)}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="space-y-5 p-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {listing.currency} {listing.price.toLocaleString()}
              <span className="text-base font-medium text-muted-foreground">/mo</span>
            </span>
            <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-foreground">
              {categoryLabel[listing.category]}
            </span>
          </div>

          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">{listing.bedrooms}</span> bed
            </li>
            <li>
              <span className="font-semibold text-foreground">{listing.bathrooms}</span> bath
            </li>
            <li>
              <span className="font-semibold text-foreground">{listing.areaSqFt.toLocaleString()}</span>{' '}
              sq ft
            </li>
          </ul>

          <p className="text-sm leading-relaxed text-foreground">{listing.address}</p>
          {expiresLabel && (
            <p className="text-xs text-muted-foreground">
              Listed until <span className="font-medium text-foreground">{expiresLabel}</span>
            </p>
          )}

          <div>
            <h3 className="mb-1.5 text-base font-semibold text-foreground">Description</h3>
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {listing.description}
            </p>
          </div>

          {listing.amenities.length > 0 && (
            <div>
              <h3 className="mb-2 text-base font-semibold text-foreground">Amenities</h3>
              <ul className="flex flex-wrap gap-2">
                {listing.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm text-foreground"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canBookRemote && (
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-foreground">Request a stay</h3>
              <p className="mb-3 mt-1 text-xs text-muted-foreground">
                The owner will confirm or decline your request.
              </p>
              {bookingOk ? (
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Request sent. Check your dashboard for status.
                </p>
              ) : (
                <form className="flex flex-col gap-3" onSubmit={handleBooking}>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-medium text-muted-foreground">
                      Start
                      <input
                        type="date"
                        required
                        value={stayStart}
                        onChange={(e) => setStayStart(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="text-xs font-medium text-muted-foreground">
                      End
                      <input
                        type="date"
                        required
                        value={stayEnd}
                        onChange={(e) => setStayEnd(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                  </div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Message (optional)
                    <textarea
                      value={stayMessage}
                      onChange={(e) => setStayMessage(e.target.value)}
                      rows={2}
                      className={fieldClass}
                      placeholder="Introduce yourself or ask a question"
                    />
                  </label>
                  {bookingError && (
                    <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                      {bookingError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={bookingSubmitting || userId === undefined}
                    className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-50"
                  >
                    {bookingSubmitting ? 'Sending…' : 'Send request'}
                  </button>
                </form>
              )}
            </div>
          )}

          {supabaseConfigured && listing.ownerId != null && userId === undefined && (
            <p className="text-xs text-muted-foreground">Checking sign-in…</p>
          )}

          {supabaseConfigured && listing.ownerId != null && userId === null && (
            <p className="text-sm text-muted-foreground">
              <Link href="/auth/login" className="font-semibold text-primary underline-offset-2 hover:underline">
                Sign in
              </Link>{' '}
              to request a stay for this listing.
            </p>
          )}

          <div className={cardClass}>
            <h3 className="mb-3 text-base font-semibold text-foreground">Contact</h3>
            <div className="flex flex-col gap-2">
              <a
                href={`tel:${listing.contact.phone.replace(/\s/g, '')}`}
                className="text-sm font-semibold text-foreground hover:text-primary hover:underline"
              >
                {listing.contact.phone}
              </a>
              <a
                href={`mailto:${listing.contact.email}`}
                className="text-sm font-semibold text-foreground hover:text-primary hover:underline"
              >
                {listing.contact.email}
              </a>
              <a
                href={`tel:${listing.contact.phone.replace(/\s/g, '')}`}
                className="mt-2 inline-flex w-fit items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
              >
                Request to visit
              </a>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
