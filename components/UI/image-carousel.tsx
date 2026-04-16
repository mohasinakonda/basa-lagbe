import Image from "next/image"
import { useState } from "react"

type Props = {
  photos: string[]
}
export const ImageCarousel = ({ photos }: Props) => {
  const [photoIndex, setPhotoIndex] = useState(0)
  const currentPhoto = photos[photoIndex] ?? photos[0]

  return (
    <div className="relative aspect-video w-full bg-muted">

      <Image
        width={1000}
        height={1000}
        src={currentPhoto}
        alt={`photo ${photoIndex + 1}`}
        className="h-full w-full object-cover"
      />
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-lg text-white shadow-md backdrop-blur-sm transition hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation()
              setPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))
            }}
            aria-label="Previous photo"
          >
            &#x276E;
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-lg text-white shadow-md backdrop-blur-sm transition hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation()
              setPhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))
            }}
            aria-label="Next photo"
          >
            &#x276F;
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`h-2 w-2 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/45 hover:bg-white/70'}`}
                onClick={() => setPhotoIndex(i)}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}