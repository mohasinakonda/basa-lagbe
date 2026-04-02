'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useListings } from '@/lib/listings-context'
import { useSupabaseUser } from '@/lib/hooks/use-supabase-user'
import { LocationPickerMap } from '@/components/location-picker/LocationPickerMap'
import type { ListingCategory } from '@/types/listing'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { formatListingBlockRelease } from '@/lib/listing-moderation'
import { ListingPhotoUpload } from '@/components/list-your-house/ListingPhotoUpload'

function defaultExpiryDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().slice(0, 10)
}

function endOfDayIso(dateYmd: string): string {
  const date = new Date(`${dateYmd}T23:59:59`)
  return date.toISOString()
}

const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'both', label: 'Both' },
]

const AMENITY_OPTIONS = ['Parking', 'Generator', 'Lift', 'Security', 'WiFi', 'Garden', 'Servant Quarter']

const ROOM_COUNT_OPTIONS = Array.from({ length: 11 }, (_, i) => String(i))

export default function ListYourHousePage() {
  const router = useRouter()
  const { addListing } = useListings()
  const userId = useSupabaseUser()
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim())

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ListingCategory>('both')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [areaSqFt, setAreaSqFt] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [photoUploadsPending, setPhotoUploadsPending] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [expiresDate, setExpiresDate] = useState(defaultExpiryDate)
  const [publishNow, setPublishNow] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [moderation, setModeration] = useState<{
    loading: boolean
    blocked: boolean
    untilIso: string | null
    reason: string | null
  }>({ loading: false, blocked: false, untilIso: null, reason: null })

  useEffect(() => {
    if (!supabaseConfigured) return
    if (userId === null) {
      router.replace('/auth/login?next=/list-your-house')
    }
  }, [supabaseConfigured, userId, router])

  useEffect(() => {
    if (!supabaseConfigured || typeof userId !== 'string') {
      setModeration({ loading: false, blocked: false, untilIso: null, reason: null })
      return
    }
    let cancelled = false
    setModeration({ loading: true, blocked: false, untilIso: null, reason: null })
    void fetch('/api/profile', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return
        const j = (await res.json()) as {
          profile?: {
            listing_creation_blocked_until?: string | null
            listing_creation_block_reason?: string | null
          }
        }
        const untilStr = j.profile?.listing_creation_blocked_until
        if (!untilStr) {
          if (!cancelled) {
            setModeration({ loading: false, blocked: false, untilIso: null, reason: null })
          }
          return
        }
        const until = new Date(untilStr).getTime()
        const blocked = until > Date.now()
        if (!cancelled) {
          setModeration({
            loading: false,
            blocked,
            untilIso: blocked ? untilStr : null,
            reason: blocked ? (j.profile?.listing_creation_block_reason ?? null) : null,
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setModeration({ loading: false, blocked: false, untilIso: null, reason: null })
        }
      })
    return () => {
      cancelled = true
    }
  }, [supabaseConfigured, userId])

  const handlePhotoUrlsChange = useCallback((urls: string[]) => {
    setPhotoUrls(urls)
  }, [])

  const toggleAmenity = (amenity: string) =>
    setAmenities((prev) => (prev.includes(amenity) ? prev.filter((x) => x !== amenity) : [...prev, amenity]))

  const handleLocationChange = (lat: number, lng: number, resolvedAddress: string) => {
    setLocation({ lat, lng })
    setAddress(resolvedAddress)
    setLocationError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (moderation.blocked) return
    if (supabaseConfigured && userId === undefined) return
    if (supabaseConfigured && userId === null) {
      router.push('/auth/login?next=/list-your-house')
      return
    }
    if (!location) {
      setLocationError('Please set your property location on the map (click the map or use “Get my current location”).')
      return
    }
    setLocationError(null)
    const trimmedPhotos = photoUrls.map((url) => url.trim()).filter(Boolean)
    const photos =
      trimmedPhotos.length > 0 ? trimmedPhotos : ['https://picsum.photos/seed/new/800/600']

    setSubmitting(true)
    try {
      await addListing({
        title: title.trim(),
        description: description.trim(),
        category,
        address: address.trim() || `Lat ${location.lat.toFixed(5)}, Lng ${location.lng.toFixed(5)}`,
        lat: location.lat,
        lng: location.lng,
        price: Number(price) || 0,
        currency: 'BDT',
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 0,
        areaSqFt: Number(areaSqFt) || 0,
        photos,
        contact: { phone: phone.trim(), email: email.trim() },
        amenities,
        expiresAt: endOfDayIso(expiresDate),
        publicationStatus: publishNow ? 'published' : 'draft',
      })
      router.push('/')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save listing')
    } finally {
      setSubmitting(false)
    }
  }

  const showBlockedPanel =
    supabaseConfigured && typeof userId === 'string' && !moderation.loading && moderation.blocked
  const showModerationLoading =
    supabaseConfigured && typeof userId === 'string' && moderation.loading

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/" className="text-(--foreground)/80 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold">List your house</h1>
      </div>

      {showModerationLoading && (
        <p className="mb-6 text-sm text-(--foreground)/70">Checking your account…</p>
      )}

      {showBlockedPanel && moderation.untilIso && (
        <div
          className="mb-8 rounded-lg border border-amber-600/50 bg-amber-500/10 px-5 py-6 text-(--foreground)"
          role="alert"
        >
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            Listing creation is restricted
          </h2>
          <p className="mt-2 text-sm text-(--foreground)/90">
            An administrator has temporarily blocked new listings on your account. You cannot submit a
            listing until the restriction ends.
          </p>
          {moderation.reason ? (
            <p className="mt-4 rounded-md border border-(--foreground)/15 bg-background/80 px-3 py-2 text-sm">
              <span className="font-medium">Reason: </span>
              {moderation.reason}
            </p>
          ) : null}
          <p className="mt-4 text-sm">
            <span className="font-medium">Restriction ends: </span>
            <time dateTime={moderation.untilIso}>{formatListingBlockRelease(moderation.untilIso)}</time>
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded border border-(--foreground)/25 px-4 py-2 text-sm font-medium hover:bg-(--foreground)/10"
          >
            Back to home
          </Link>
        </div>
      )}

      {!showBlockedPanel && !showModerationLoading && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <Label htmlFor="title" required>
              Title
            </Label>
            <Input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}

              placeholder="e.g. Spacious 3BHK in Dhanmondi"
            />
          </div>

          <div>
            <Label htmlFor="description" required>
              Description *
            </Label>
            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-(--foreground)/20 bg-background px-3 py-2"
              placeholder="Describe the property..."
            />
          </div>

          <div>
            <Label required>Category </Label>
            <div className="flex gap-4">
              {CATEGORIES.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2">
                  <input
                    className='w-4 h-4 accent-foreground'
                    type="radio"
                    name="category"
                    value={opt.value}
                    checked={category === opt.value}
                    onChange={() => setCategory(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <LocationPickerMap
              value={location}
              onChange={handleLocationChange}
              required
            />
            {locationError && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {locationError}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="expiresDate" required>
              Listing expires on
            </Label>
            <Input
              id="expiresDate"
              type="date"
              required
              value={expiresDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setExpiresDate(e.target.value)}
            />
            <p className="mt-1 text-xs text-(--foreground)/60">
              After this date the listing is hidden from the public map until you extend it.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="publishNow"
              type="checkbox"
              className="h-4 w-4 accent-foreground"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
            />
            <Label htmlFor="publishNow">Publish immediately (uncheck to save as draft)</Label>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="price" required>
                Price (BDT/mo)
              </Label>
              <Input
                id="price"
                type="number"
                required
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}

              />
            </div>
            <div>
              <Label htmlFor="bedrooms" required>
                Bedrooms
              </Label>
              <select
                id="bedrooms"
                required
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full rounded border border-(--foreground)/20 bg-background px-3 py-2"
              >
                <option value="" disabled>
                  Select
                </option>
                {ROOM_COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="bathrooms" required>
                Bathrooms
              </Label>
              <select
                id="bathrooms"
                required
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full rounded border border-(--foreground)/20 bg-background px-3 py-2"
              >
                <option value="" disabled>
                  Select
                </option>
                {ROOM_COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="areaSqFt" required>
                Area (sq ft)
              </Label>
              <Input
                id="areaSqFt"
                type="number"
                required
                min={0}
                value={areaSqFt}
                onChange={(e) => setAreaSqFt(e.target.value)}

              />
            </div>
          </div>

          <ListingPhotoUpload
            onUrlsChange={handlePhotoUrlsChange}
            onUploadingChange={setPhotoUploadsPending}
            disabled={submitting || moderation.blocked}
          />

          <div>
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <label key={a} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className='w-4 h-4 accent-foreground'
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="phone" required>
                Contact phone
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}

                placeholder="+880 1712-345678"
              />
            </div>
            <div>
              <Label htmlFor="email" required>
                Contact email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}

                placeholder="you@example.com"
              />
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={
                submitting ||
                photoUploadsPending ||
                moderation.blocked ||
                (supabaseConfigured && !userId)
              }
              className="rounded bg-foreground px-6 py-2 text-background hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Submit listing'}
            </button>
            <Link
              href="/"
              className="rounded border border-(--foreground)/20 px-6 py-2 hover:bg-(--foreground)/10"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </main>
  )
}
