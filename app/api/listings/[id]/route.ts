import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/env'
import { rowToListing, type ListingRow } from '@/lib/listing-mapper'
import type { ListingCategory } from '@/types/listing'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const { id } = await context.params
  const supabase = await createClient()
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).maybeSingle()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ listing: rowToListing(data as ListingRow) })
}

type PatchBody = Partial<{
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
  contact: { phone: string; email: string }
  status: 'draft' | 'published' | 'archived'
  expiresAt: string
}>

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (body.title != null) update.title = body.title.trim()
  if (body.description != null) update.description = body.description.trim()
  if (body.category != null) update.category = body.category
  if (body.lat != null) update.lat = body.lat
  if (body.lng != null) update.lng = body.lng
  if (body.price != null) update.price = body.price
  if (body.currency != null) update.currency = body.currency
  if (body.bedrooms != null) update.bedrooms = body.bedrooms
  if (body.bathrooms != null) update.bathrooms = body.bathrooms
  if (body.areaSqFt != null) update.area_sq_ft = body.areaSqFt
  if (body.address != null) update.address = body.address.trim()
  if (body.photos != null) update.photos = body.photos
  if (body.amenities != null) update.amenities = body.amenities
  if (body.contact != null) update.contact = body.contact
  if (body.status != null) update.status = body.status
  if (body.expiresAt != null) update.expires_at = body.expiresAt

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('listings')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ listing: rowToListing(data as ListingRow) })
}
