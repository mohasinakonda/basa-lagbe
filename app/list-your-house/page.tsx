'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useListings } from '@/lib/listings-context'
import { LocationPickerMap } from '@/components/location-picker/LocationPickerMap'
import type { ListingCategory } from '@/types/listing'

const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'both', label: 'Both' },
]

const AMENITY_OPTIONS = ['Parking', 'Generator', 'Lift', 'Security', 'WiFi', 'Garden', 'Servant Quarter']

export default function ListYourHousePage() {
  const router = useRouter()
  const { addListing } = useListings()

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
  const [photoUrls, setPhotoUrls] = useState([''])
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!location) {
      setLocationError('Please set your property location on the map (click the map or use “Get my current location”).')
      return
    }
    setLocationError(null)
    const photos = photoUrls.map((u) => u.trim()).filter(Boolean)
    if (photos.length === 0) photos.push('https://picsum.photos/seed/new/800/600')

    addListing({
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
    })
    router.push('/')
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/" className="text-[var(--foreground)]/80 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold">List your house</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Title *
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2"
            placeholder="e.g. Spacious 3BHK in Dhanmondi"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            Description *
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2"
            placeholder="Describe the property..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Category *</label>
          <div className="flex gap-4">
            {CATEGORIES.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
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

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium">
              Price (BDT/mo) *
            </label>
            <input
              id="price"
              type="number"
              required
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="bedrooms" className="mb-1 block text-sm font-medium">
              Bedrooms *
            </label>
            <input
              id="bedrooms"
              type="number"
              required
              min={0}
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="bathrooms" className="mb-1 block text-sm font-medium">
              Bathrooms *
            </label>
            <input
              id="bathrooms"
              type="number"
              required
              min={0}
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className="w-full rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="areaSqFt" className="mb-1 block text-sm font-medium">
              Area (sq ft) *
            </label>
            <input
              id="areaSqFt"
              type="number"
              required
              min={0}
              value={areaSqFt}
              onChange={(e) => setAreaSqFt(e.target.value)}
              className="w-full rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Photo URLs</label>
          <div className="flex flex-col gap-2">
            {photoUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setPhotoUrl(i, e.target.value)}
                  className="flex-1 rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => removePhotoField(i)}
                  className="rounded border border-[var(--foreground)]/20 px-3 py-2 hover:bg-[var(--foreground)]/10"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPhotoField}
              className="w-fit rounded border border-[var(--foreground)]/20 px-3 py-2 hover:bg-[var(--foreground)]/10"
            >
              Add photo URL
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <label key={a} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={amenities.includes(a)}
                  onChange={() => toggleAmenity(a)}
                />
                {a}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium">
              Contact phone *
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2"
              placeholder="+880 1712-345678"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Contact email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="rounded bg-[var(--foreground)] px-6 py-2 text-[var(--background)] hover:opacity-90"
          >
            Submit listing
          </button>
          <Link
            href="/"
            className="rounded border border-[var(--foreground)]/20 px-6 py-2 hover:bg-[var(--foreground)]/10"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  )
}
