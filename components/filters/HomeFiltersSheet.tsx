'use client'

import React, { useEffect, useRef } from 'react'
import { FilterSheetFloatingRootRefContext } from '@/components/filters/FilterSheetFloatingRootContext'
import { ListingFiltersForm, type ListingFiltersFormProps } from '@/components/filters/ListingFiltersForm'

export interface HomeFiltersSheetProps extends ListingFiltersFormProps {
  open: boolean
  onClose: () => void
  onApply: () => void
  onClear: () => void
}

export function HomeFiltersSheet({
  open,
  onClose,
  onApply,
  onClear,
  ...formProps
}: HomeFiltersSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) {
      if (!el.open) el.showModal()
    } else {
      el.close()
    }
  }, [open])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    el.addEventListener('cancel', onCancel)
    return () => el.removeEventListener('cancel', onCancel)
  }, [onClose])

  return (
    <FilterSheetFloatingRootRefContext.Provider value={dialogRef}>
    <dialog
      ref={dialogRef}
      className="fixed inset-x-3 bottom-3 top-auto z-50 m-0 max-h-[85vh] w-[calc(100%-1.5rem)] max-w-lg translate-y-0 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] p-0 shadow-lg backdrop:bg-black/40 md:inset-x-auto md:left-1/2 md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2"
      onClose={onClose}
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-center justify-between border-b border-[var(--foreground)]/15 px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Filters</h2>
          <button
            type="button"
            className="rounded px-2 py-1 text-sm text-[var(--foreground)]/90 hover:bg-[var(--foreground)]/10"
            onClick={onClose}
            aria-label="Close filters"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">
          <ListingFiltersForm variant="sheet" idPrefix="sheet-" {...formProps} />
        </div>
        <div className="flex flex-wrap gap-2 border-t border-[var(--foreground)]/15 px-4 py-3">
          <button
            type="button"
            className="rounded border border-[var(--foreground)]/30 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/8"
            onClick={() => {
              onClear()
            }}
          >
            Clear all
          </button>
          <button
            type="button"
            className="ml-auto rounded bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
            onClick={() => {
              onApply()
              onClose()
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </dialog>
    </FilterSheetFloatingRootRefContext.Provider>
  )
}
