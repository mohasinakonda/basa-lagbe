export type ListingCategory = 'family' | 'bachelor' | 'both'

export interface ListingContact {
  phone: string
  email: string
}

export interface Listing {
  id: string
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
}
