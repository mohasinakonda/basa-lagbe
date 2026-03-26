'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { LocationPickerMap } from '@/components/location-picker/LocationPickerMap'
import type { Listing, ListingCategory } from '@/types/listing'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'

const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'both', label: 'Both' },
]

const AMENITY_OPTIONS = ['Parking', 'Generator', 'Lift', 'Security', 'WiFi', 'Garden', 'Servant Quarter']

function toDateInput(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

function endOfDayIso(dateYmd: string): string {
  return new Date(`${dateYmd}T23:59:59`).toISOString()
}

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
  const [photoUrls, setPhotoUrls] = useState<string[]>([''])
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [expiresDate, setExpiresDate] = useState('')
  const [status, setStatus] = useState<Listing['publicationStatus']>('published')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/listings/${id}`, { credentials: 'include' })
        if (res.status === 401) {
          router.replace('/auth/login?next=' + encodeURIComponent(`/dashboard/listings/${id}/edit`))
          return
        }
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(j.error ?? 'Failed to load listing')
        }
        const j = (await res.json()) as { listing: Listing }
        if (cancelled) return
        const l = j.listing
        setTitle(l.title)
        setDescription(l.description)
        setCategory(l.category)
        setLocation({ lat: l.lat, lng: l.lng })
        setAddress(l.address)
        setPrice(String(l.price))
        setBedrooms(String(l.bedrooms))
        setBathrooms(String(l.bathrooms))
        setAreaSqFt(String(l.areaSqFt))
        setPhotoUrls(l.photos.length ? l.photos : [''])
        setPhone(l.contact.phone)
        setEmail(l.contact.email)
        setAmenities(l.amenities)
        setExpiresDate(toDateInput(l.expiresAt))
        setStatus(l.publicationStatus ?? 'published')
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, router])

  const addPhotoField = () => setPhotoUrls((prev) => [...prev, ''])
  const removePhotoField = (i: number) =>
    setPhotoUrls((prev) => prev.filter((_, idx) => idx !== i))
  const setPhotoUrl = (i: number, value: string) =>
    setPhotoUrls((prev) => prev.map((url, idx) => (idx === i ? value : url)))

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))

  const handleLocationChange = (lat: number, lng: number, resolvedAddress: string) => {
    setLocation({ lat, lng })
    setAddress(resolvedAddress)
    setLocationError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!location) {
      setLocationError('Please set location on the map.')
      return
    }
    setLocationError(null)
    const photos = photoUrls.map((u) => u.trim()).filter(Boolean)
    if (photos.length === 0) photos.push('https://picsum.photos/seed/edit/800/600')

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          lat: location.lat,
          lng: location.lng,
          address: address.trim(),
          price: Number(price) || 0,
          currency: 'BDT',
          bedrooms: Number(bedrooms) || 0,
          bathrooms: Number(bathrooms) || 0,
          areaSqFt: Number(areaSqFt) || 0,
          photos,
          amenities,
          contact: { phone: phone.trim(), email: email.trim() },
          status,
          expiresAt: endOfDayIso(expiresDate),
        }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'Save failed')
      router.push('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-(--foreground)/70">Loading listing…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard" className="text-(--foreground)/80 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold">Edit listing</h1>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

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
          />
        </div>

        <div>
          <Label htmlFor="description" required>
            Description
          </Label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-(--foreground)/20 bg-background px-3 py-2"
          />
        </div>

        <div>
          <Label required>Category</Label>
          <div className="flex gap-4">
            {CATEGORIES.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  className="h-4 w-4 accent-foreground"
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
          <LocationPickerMap value={location} onChange={handleLocationChange} required />
          {locationError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {locationError}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="expiresEdit" required>
            Listing expires on
          </Label>
          <Input
            id="expiresEdit"
            type="date"
            required
            value={expiresDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setExpiresDate(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="statusEdit">Visibility</Label>
          <select
            id="statusEdit"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as Listing['publicationStatus'])
            }
            className="mt-1 w-full rounded border border-(--foreground)/20 bg-background px-3 py-2"
          >
            <option value="draft">Draft (only you)</option>
            <option value="published">Published (on map)</option>
            <option value="archived">Archived</option>
          </select>
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
            <Input
              id="bedrooms"
              type="number"
              required
              min={0}
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bathrooms" required>
              Bathrooms
            </Label>
            <Input
              id="bathrooms"
              type="number"
              required
              min={0}
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
            />
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

        <div>
          <Label>Photo URLs</Label>
          <div className="flex flex-col gap-2">
            {photoUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setPhotoUrl(i, e.target.value)}
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => removePhotoField(i)}
                  className="rounded border border-(--foreground)/20 px-3 py-2 hover:bg-(--foreground)/10"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPhotoField}
              className="w-fit rounded border border-(--foreground)/20 px-3 py-2 hover:bg-(--foreground)/10"
            >
              Add photo URL
            </button>
          </div>
        </div>

        <div>
          <Label>Amenities</Label>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <label key={a} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={amenities.includes(a)}
                  onChange={() => toggleAmenity(a)}
                  className="h-4 w-4 accent-foreground"
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
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-foreground px-6 py-2 text-background hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <Link
            href="/dashboard"
            className="rounded border border-(--foreground)/20 px-6 py-2 hover:bg-(--foreground)/10"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  )
}
