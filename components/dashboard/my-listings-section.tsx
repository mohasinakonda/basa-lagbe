'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import type { Listing, ListingPublicationStatus } from '@/types/listing'

export type MyListingsSectionProps = {
  listings: Listing[]
  onAfterMutation: () => void | Promise<void>
}

function thumbnailUrlForListing(listing: Listing): string {
  const firstPhoto = listing.photos[0]
  if (firstPhoto) return firstPhoto
  return `https://picsum.photos/seed/${encodeURIComponent(listing.id)}/160/120`
}

export function MyListingsSection({ listings, onAfterMutation }: MyListingsSectionProps) {
  const [listingIdPendingAction, setListingIdPendingAction] = useState<string | null>(null)

  const updateListingPublicationStatus = async (
    listingId: string,
    nextStatus: ListingPublicationStatus,
  ) => {
    setListingIdPendingAction(listingId)
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus }),
      })
      if (response.ok) await onAfterMutation()
    } finally {
      setListingIdPendingAction(null)
    }
  }

  const deleteListingById = async (listingId: string) => {
    if (!confirm('Delete this listing permanently? This cannot be undone.')) return
    setListingIdPendingAction(listingId)
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) await onAfterMutation()
    } finally {
      setListingIdPendingAction(null)
    }
  }

  if (listings.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">My listings</h2>
          <Link
            href="/list-your-house"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            New listing
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">No listings yet.</p>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">My listings</h2>
        <Link
          href="/list-your-house"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          New listing
        </Link>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-[88px] px-3 py-2 font-medium text-foreground" scope="col">
                Photo
              </th>
              <th className="min-w-[140px] px-3 py-2 font-medium text-foreground" scope="col">
                Title
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-foreground" scope="col">
                Price
              </th>
              <th className="whitespace-nowrap px-3 py-2 font-medium text-foreground" scope="col">
                Expires
              </th>
              <th className="px-3 py-2 text-right font-medium text-foreground" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => {
              const isActionPendingForThisRow = listingIdPendingAction === listing.id
              const publicationStatus = listing.publicationStatus
              const isCurrentlyPublished = publicationStatus === 'published'
              const editHref = `/dashboard/listings/${listing.id}/edit`
              const expiresLabel = listing.expiresAt
                ? new Date(listing.expiresAt).toLocaleDateString()
                : '—'

              return (
                <tr key={listing.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 align-middle">
                    {/* eslint-disable-next-line @next/next/no-img-element -- user photo URLs + fallback host */}
                    <img
                      src={thumbnailUrlForListing(listing)}
                      alt={`${listing.title} thumbnail`}
                      className="h-12 w-16 rounded-lg border border-border object-cover"
                      width={64}
                      height={48}
                    />
                  </td>
                  <td className="max-w-[220px] px-3 py-2 align-middle">
                    <p className="truncate font-medium text-foreground" title={listing.title}>
                      {listing.title}
                    </p>
                    {publicationStatus && (
                      <p className="text-xs capitalize text-muted-foreground">{publicationStatus}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle text-foreground">
                    {listing.currency} {listing.price.toLocaleString()}
                    <span className="text-muted-foreground">/mo</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-middle text-muted-foreground">
                    {expiresLabel}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs">
                      <Link
                        href={editHref}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={isActionPendingForThisRow}
                        className="font-medium text-foreground underline-offset-2 hover:underline disabled:opacity-50"
                        onClick={() =>
                          updateListingPublicationStatus(
                            listing.id,
                            isCurrentlyPublished ? 'archived' : 'published',
                          )
                        }
                      >
                        {isCurrentlyPublished ? 'Unlist' : 'List'}
                      </button>
                      <button
                        type="button"
                        disabled={isActionPendingForThisRow}
                        className="font-medium text-red-600 underline-offset-2 hover:underline dark:text-red-400 disabled:opacity-50"
                        onClick={() => deleteListingById(listing.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
