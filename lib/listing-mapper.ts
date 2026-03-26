import type { Listing, ListingCategory, ListingContact } from '@/types/listing'

export type ListingRow = {
  id: string
  owner_id: string
  title: string
  description: string
  category: string
  lat: number
  lng: number
  price: number
  currency: string
  bedrooms: number
  bathrooms: number
  area_sq_ft: number
  address: string
  photos: unknown
  amenities: unknown
  contact: unknown
  status: string
  expires_at: string
  created_at: string
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string')
  return []
}

function asContact(v: unknown): ListingContact {
  if (v && typeof v === 'object' && 'phone' in v && 'email' in v) {
    const o = v as Record<string, unknown>
    return {
      phone: String(o.phone ?? ''),
      email: String(o.email ?? ''),
    }
  }
  return { phone: '', email: '' }
}

export function rowToListing(row: ListingRow): Listing {
  const category = row.category as ListingCategory
  return {
    id: row.id,
    ownerId: row.owner_id,
    publicationStatus: row.status as Listing['publicationStatus'],
    title: row.title,
    description: row.description,
    category,
    lat: row.lat,
    lng: row.lng,
    price: Number(row.price),
    currency: row.currency,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    areaSqFt: row.area_sq_ft,
    address: row.address,
    photos: asStringArray(row.photos),
    contact: asContact(row.contact),
    amenities: asStringArray(row.amenities),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }
}

export function listingToInsertPayload(input: {
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
  amenities: string[]
  contact: ListingContact
  status: 'draft' | 'published'
  expiresAt: string
  ownerId: string
}) {
  return {
    owner_id: input.ownerId,
    title: input.title,
    description: input.description,
    category: input.category,
    lat: input.lat,
    lng: input.lng,
    price: input.price,
    currency: input.currency,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    area_sq_ft: input.areaSqFt,
    address: input.address,
    photos: input.photos,
    amenities: input.amenities,
    contact: input.contact,
    status: input.status,
    expires_at: input.expiresAt,
  }
}
