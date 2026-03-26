export type ListingCategory = 'family' | 'bachelor' | 'both'

export type ListingPublicationStatus = 'draft' | 'published' | 'archived'

export interface ListingContact {
  phone: string
  email: string
}

export interface Listing {
  id: string
  /** Set when loaded from API / DB */
  ownerId?: string
  publicationStatus?: ListingPublicationStatus
  title: string
  description: string
  category: ListingCategory
  lat: number
  lng: number
  price: number
  currency: string
  bedrooms: number
  bathrooms: number
  areaSqFt: number
  address: string
  photos: string[]
  contact: ListingContact
  amenities: string[]
  createdAt: string
  /** ISO date — listing hidden from public map after this instant */
  expiresAt: string
}
