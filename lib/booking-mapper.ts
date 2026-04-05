import type { Booking, BookingStatus } from '@/types/booking'

export type BookingRow = {
  id: string
  listing_id: string
  guest_id: string
  guest_display_name: string
  guest_email?: string | null
  listing_title: string
  status: string
  requested_start: string
  requested_end: string
  message: string | null
  owner_responded_at: string | null
  owner_decline_message?: string | null
  created_at: string
}

/** PostgREST select for list/detail responses with guest + listing context */
export const BOOKING_LIST_SELECT =
  '*, guest_profile:profiles!guest_id(phone_e164, contact_address), listing:listings!listing_id(address)'

type GuestProfileEmbed = { phone_e164: string | null; contact_address: string | null } | null
type ListingEmbed = { address: string } | null

export type BookingRowWithRelations = BookingRow & {
  guest_profile?: GuestProfileEmbed
  listing?: ListingEmbed
}

export function rowToBooking(row: BookingRowWithRelations): Booking {
  const gp = row.guest_profile
  const li = row.listing
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    guestId: row.guest_id,
    guestDisplayName: row.guest_display_name,
    guestEmail: row.guest_email ?? null,
    guestPhoneE164: gp?.phone_e164 ?? null,
    guestContactAddress: gp?.contact_address ?? null,
    listingAddress: li?.address ?? null,
    status: row.status as BookingStatus,
    requestedStart: row.requested_start,
    requestedEnd: row.requested_end,
    message: row.message,
    ownerRespondedAt: row.owner_responded_at,
    ownerDeclineMessage: row.owner_decline_message ?? null,
    createdAt: row.created_at,
  }
}
