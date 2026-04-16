
import { Listing } from "@/types/listing";
import { ImageCarousel } from "../UI/image-carousel";


const PLACEHOLDER = 'https://picsum.photos/seed/placeholder/800/600'

function formatPriceLine(listing: Listing): string {
  return `${listing.currency} ${listing.price.toLocaleString()}/mo`
}

export function ListingCard({
  listing,
  selected,
  onSelect,
}: {
  listing: Listing
  selected: boolean
  onSelect: () => void
}) {
  const photos = listing.photos.length > 0 ? listing.photos : [PLACEHOLDER]



  const mapsUrl = `https://www.google.com/maps?q=${listing.lat},${listing.lng}`

  return (
    <article
      onClick={onSelect}
      className={`group overflow-hidden rounded-2xl border bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover ${selected ? 'border-primary/45 ring-2 ring-primary/25' : 'border-border'
        }`}
    >
      <ImageCarousel photos={photos} />

      <article

        className="w-full px-4 pb-3 pt-3 text-left"

        aria-label={`View ${listing.title}`}
      >
        <p className="line-clamp-1 text-[15px] font-medium text-foreground">{listing.title}</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          {formatPriceLine(listing)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {listing.bedrooms} bed · {listing.bathrooms} bath

        </p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{listing.address.trim()}</p>
      </article>

      <div className="flex flex-wrap gap-3 border-t border-border px-4 py-2.5">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-foreground underline-offset-2 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Directions
        </a>
        <button
          type="button"
          className="text-xs font-semibold text-foreground underline-offset-2 hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          View details
        </button>
      </div>
    </article>
  )
}