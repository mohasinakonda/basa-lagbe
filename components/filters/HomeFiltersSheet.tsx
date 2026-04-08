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
        className="fixed inset-x-3 bottom-3 top-auto z-50 m-0 max-h-[85vh] w-[calc(100%-1.5rem)] max-w-lg translate-y-0 rounded-2xl border border-border bg-surface p-0 shadow-dialog backdrop:bg-black/45 backdrop:backdrop-blur-sm md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
        onClose={onClose}
      >
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <h2 className="text-base font-semibold text-foreground">Filters</h2>
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={onClose}
              aria-label="Close filters"
            >
              Close
            </button>
          </div>
          <div className="overflow-y-auto px-4 py-4">
            <ListingFiltersForm variant="sheet" idPrefix="sheet-" {...formProps} />
          </div>
          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              className="order-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:order-1 sm:py-2.5"
              onClick={() => {
                onClear()
              }}
            >
              Clear all
            </button>
            <button
              type="button"
              className="order-1 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105 sm:order-2 sm:ml-auto sm:w-auto sm:min-w-[10rem] sm:py-2.5"
              onClick={() => {
                onApply()
                onClose()
              }}
            >
              Show results
            </button>
          </div>
        </div>
      </dialog>
    </FilterSheetFloatingRootRefContext.Provider>
  )
}
