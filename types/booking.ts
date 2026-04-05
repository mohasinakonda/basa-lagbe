export type BookingStatus =
  | 'pending_owner'
  | 'confirmed'
  | 'declined'
  | 'cancelled_by_guest'

export interface Booking {
  id: string
  listingId: string
  listingTitle: string
  guestId: string
  guestDisplayName: string
  /** Snapshot at request time; may be null for older rows */
  guestEmail: string | null
  /** From guest profile when visible to the listing owner */
  guestPhoneE164: string | null
  guestContactAddress: string | null
  /** Property address for this booking */
  listingAddress: string | null
  status: BookingStatus
  requestedStart: string
  requestedEnd: string
  message: string | null
  ownerRespondedAt: string | null
  /** Set when owner declines */
  ownerDeclineMessage: string | null
  createdAt: string
}
