'use client'

import React from 'react'
import { ListingSortSelect } from '@/components/filters/ListingSortSelect'
import { ListingFiltersForm } from '@/components/filters/ListingFiltersForm'
import type { ListingFiltersFormProps } from '@/components/filters/ListingFiltersForm'
import type { ListingSortMode } from '@/types/filters'

export type { LocationFilter } from '@/types/filters'

export interface FilterBarProps extends ListingFiltersFormProps {
  searchQuery?: string
  onSearchChange?: (value: string) => void
  sortMode?: ListingSortMode
  onSortModeChange?: (mode: ListingSortMode) => void
  canSortByDistance?: boolean
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  sortMode,
  onSortModeChange,
  canSortByDistance,
  ...formProps
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[var(--foreground)]/10 bg-[var(--background)] px-4 py-3">
      {onSearchChange != null && (
        <div className="flex min-w-[min(100%,14rem)] flex-1 items-center gap-2">
          <label htmlFor="filter-search-desktop" className="sr-only">
            Search listings
          </label>
          <input
            id="filter-search-desktop"
            type="search"
            placeholder="Search title, address…"
            value={searchQuery ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="min-w-0 flex-1 rounded border border-[var(--foreground)]/25 bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/50"
            autoComplete="off"
          />
        </div>
      )}
      <ListingFiltersForm variant="bar" idPrefix="" {...formProps} />
      {sortMode != null && onSortModeChange != null && canSortByDistance != null && (
        <div className="flex items-center gap-2 md:hidden">
          <span className="text-sm font-medium text-[var(--foreground)]/80">Sort</span>
          <ListingSortSelect
            id="filter-sort-desktop"
            value={sortMode}
            onChange={onSortModeChange}
            canSortByDistance={canSortByDistance}
          />
        </div>
      )}
    </div>
  )
}
