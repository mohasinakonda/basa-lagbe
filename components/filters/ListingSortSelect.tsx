'use client'


import { FloatingSelect } from '@/components/UI/floating-select'
import type { ListingSortMode } from '@/types/filters'

const SORT_OPTIONS: { value: ListingSortMode; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'distance_asc', label: 'Distance: nearest' },
]

export interface ListingSortSelectProps {
  id: string
  value: ListingSortMode
  onChange: (mode: ListingSortMode) => void
  canSortByDistance: boolean
  className?: string
}

export function ListingSortSelect({
  id,
  value,
  onChange,
  canSortByDistance,
  className = '',
}: ListingSortSelectProps) {
  const options = canSortByDistance
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter((o) => o.value !== 'distance_asc')
  const displayValue =
    !canSortByDistance && value === 'distance_asc' ? 'newest' : value

  return (
    <div className={className}>
      <FloatingSelect<ListingSortMode>
        id={id}
        ariaLabel="Sort listings"
        value={displayValue}
        onChange={(value) => {
          if (value === 'distance_asc' && !canSortByDistance) return
          onChange(value)
        }}
        options={options}
      />
    </div>
  )
}
