'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Label } from '@/components/UI/label'
import { uploadFileToImageKit, type ImageKitAuthPayload } from '@/lib/imagekit-client-upload'

type PhotoItem = {
  id: string
  url: string | null
  previewUrl: string
  uploading: boolean
  error: string | null
}

export function ListingPhotoUpload({
  onUrlsChange,
  onUploadingChange,
  disabled,
}: {
  onUrlsChange: (urls: string[]) => void
  onUploadingChange?: (uploading: boolean) => void
  disabled?: boolean
}) {
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const photosRef = useRef(photos)
  photosRef.current = photos

  useEffect(() => {
    onUrlsChange(photos.filter((p) => p.url).map((p) => p.url!))
  }, [photos, onUrlsChange])

  useEffect(() => {
    onUploadingChange?.(photos.some((p) => p.uploading))
  }, [photos, onUploadingChange])

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
      })
    }
  }, [])

  const processFile = useCallback((file: File) => {
    const id = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)
    setPhotos((prev) => [
      ...prev,
      { id, url: null, previewUrl, uploading: true, error: null },
    ])

    void (async () => {
      try {
        const authRes = await fetch('/api/imagekit/auth', { credentials: 'include' })
        if (!authRes.ok) {
          const j = (await authRes.json().catch(() => ({}))) as { error?: string }
          throw new Error(j.error ?? 'Could not start upload')
        }
        const auth = (await authRes.json()) as ImageKitAuthPayload
        const data = await uploadFileToImageKit(file, auth)
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, url: data.url, uploading: false, error: null, previewUrl: '' }
              : p
          )
        )
        URL.revokeObjectURL(previewUrl)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Upload failed'
        setPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, uploading: false, error: msg } : p))
        )
      }
    })()
  }, [])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach(processFile)
    },
    [processFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    disabled,
    multiple: true,
  })

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const uploadingCount = photos.filter((p) => p.uploading).length

  return (
    <div>
      <Label>Photos</Label>
      <p className="mt-1 mb-3 text-xs text-(--foreground)/60">
        Drag and drop or click to add images. They upload to ImageKit; you can delete any preview
        before submitting.
      </p>

      <div
        {...getRootProps({
          className: [
            'rounded-lg border-2 border-dashed border-(--foreground)/25 bg-(--foreground)/5 px-4 py-8 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--foreground)/30',
            isDragActive ? 'border-foreground/50 bg-(--foreground)/10' : '',
            disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer',
          ]
            .filter(Boolean)
            .join(' '),
        })}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-(--foreground)/80">
          {isDragActive ? 'Drop images here…' : 'Drag images here, or click to choose files'}
        </p>
        <p className="mt-2 text-xs text-(--foreground)/55">PNG, JPG, WebP, GIF — multiple files ok</p>
      </div>

      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => {
            const src = p.url ?? p.previewUrl
            return (
              <li
                key={p.id}
                className="relative aspect-4/3 overflow-hidden rounded-md border border-(--foreground)/15 bg-(--foreground)/5"
              >
                {src ? (
                  <img src={src} alt="" className="h-full w-full object-cover" />
                ) : null}
                {p.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs font-medium">
                    Uploading…
                  </div>
                )}
                {p.error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-950/80 p-2 text-center text-xs text-red-50">
                    <span>{p.error}</span>
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      className="rounded border border-red-200/50 px-2 py-0.5 hover:bg-red-900/50"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {!p.uploading && !p.error && (
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="absolute right-1 top-1 rounded border border-(--foreground)/30 bg-background/90 px-2 py-1 text-xs font-medium shadow-sm hover:bg-background"
                    aria-label="Remove image"
                  >
                    Delete
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {uploadingCount > 0 && (
        <p className="mt-2 text-xs text-(--foreground)/60">
          Uploading {uploadingCount} image{uploadingCount === 1 ? '' : 's'}…
        </p>
      )}
    </div>
  )
}
