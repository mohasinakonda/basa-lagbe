'use client'

import React, { useEffect, useRef, useState } from 'react'
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

export function ListingDetailSidebar({
  listing,
  onClose,
  onShare,
  isFavorite = false,
  onToggleFavorite,
}: ListingDetailSidebarProps) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (listing) closeButtonRef.current?.focus()
  }, [listing])

  if (!listing) return null

  const photos = listing.photos.length > 0 ? listing.photos : ['https://picsum.photos/seed/placeholder/800/600']
  const currentPhoto = photos[photoIndex] ?? photos[0]

  return (
    <aside
      className="flex h-full w-full max-w-md flex-col border-r border-[var(--foreground)]/10 bg-[var(--background)] shadow-lg md:max-w-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Listing details"
    >
      <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 p-3">
        <h2 className="text-lg font-semibold truncate pr-2">{listing.title}</h2>
        <div className="flex items-center gap-1 shrink-0">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(listing.id)}
              className="rounded p-2 hover:bg-[var(--foreground)]/10"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span className={isFavorite ? 'text-red-500' : 'text-[var(--foreground)]/60'}>
                {isFavorite ? '♥' : '♡'}
              </span>
            </button>
          )}
          {onShare && (
            <button
              type="button"
              onClick={() => onShare(listing)}
              className="rounded p-2 hover:bg-[var(--foreground)]/10"
              aria-label="Share listing"
            >
              Share
            </button>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded p-2 hover:bg-[var(--foreground)]/10"
            aria-label="Close details"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Photo gallery */}
        <div className="relative aspect-video w-full bg-[var(--foreground)]/5">
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
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                onClick={() => setPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                onClick={() => setPhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
                aria-label="Next photo"
              >
                ›
              </button>
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`h-2 w-2 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/50'}`}
                    onClick={() => setPhotoIndex(i)}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl font-bold text-[var(--foreground)]">
              {listing.currency} {listing.price.toLocaleString()}/mo
            </span>
            <span className="rounded bg-[var(--foreground)]/10 px-2 py-0.5 text-sm">
              {categoryLabel[listing.category]}
            </span>
          </div>

          <ul className="flex flex-wrap gap-3 text-sm text-[var(--foreground)]/80">
            <li>{listing.bedrooms} bed</li>
            <li>{listing.bathrooms} bath</li>
            <li>{listing.areaSqFt.toLocaleString()} sq ft</li>
          </ul>

          <p className="text-sm text-[var(--foreground)]/90">{listing.address}</p>
          <p className="text-sm leading-relaxed">{listing.description}</p>

          {listing.amenities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-1">Amenities</h3>
              <ul className="flex flex-wrap gap-2">
                {listing.amenities.map((a) => (
                  <li
                    key={a}
                    className="rounded bg-[var(--foreground)]/10 px-2 py-1 text-sm"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium mb-2">Contact</h3>
            <div className="flex flex-col gap-2">
              <a
                href={`tel:${listing.contact.phone.replace(/\s/g, '')}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {listing.contact.phone}
              </a>
              <a
                href={`mailto:${listing.contact.email}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {listing.contact.email}
              </a>
              <a
                href={`tel:${listing.contact.phone.replace(/\s/g, '')}`}
                className="mt-2 inline-flex w-fit items-center justify-center rounded bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
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
