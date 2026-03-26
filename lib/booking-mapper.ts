import type { Booking, BookingStatus } from '@/types/booking'

export type BookingRow = {
  id: string
  listing_id: string
  guest_id: string
  guest_display_name: string
  listing_title: string
  status: string
  requested_start: string
  requested_end: string
  message: string | null
  owner_responded_at: string | null
  created_at: string
}

export function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    guestId: row.guest_id,
    guestDisplayName: row.guest_display_name,
    status: row.status as BookingStatus,
    requestedStart: row.requested_start,
    requestedEnd: row.requested_end,
    message: row.message,
    ownerRespondedAt: row.owner_responded_at,
    createdAt: row.created_at,
  }
}
