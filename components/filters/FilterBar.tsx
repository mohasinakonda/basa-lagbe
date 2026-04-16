'use client'

import React from 'react'
import { HomeSearchField } from '@/components/home/home-search-field'
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  )
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
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3 shadow-[inset_0_-1px_0_rgb(0_0_0/0.04)] md:px-6">
      {onSearchChange != null && (
        <div className="flex min-w-[min(100%,14rem)] flex-1 items-center gap-2">
          <label htmlFor="filter-search-desktop" className="sr-only">
            Search listings
          </label>
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-muted-foreground" />
            <HomeSearchField
              id="filter-search-desktop"
              initialQuery={searchQuery ?? ''}
              onCommit={onSearchChange}
              className="h-10 w-full min-w-0 rounded-full border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-shadow focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}
      <ListingFiltersForm variant="bar" idPrefix="" {...formProps} />
      {sortMode != null && onSortModeChange != null && canSortByDistance != null && (
        <div className="flex items-center gap-2 md:hidden">
          <span className="text-sm font-medium text-muted-foreground">Sort</span>
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
