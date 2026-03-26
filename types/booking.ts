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
  status: BookingStatus
  requestedStart: string
  requestedEnd: string
  message: string | null
  ownerRespondedAt: string | null
  createdAt: string
}
