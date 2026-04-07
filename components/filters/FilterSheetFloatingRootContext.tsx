'use client'

import { createContext, type RefObject } from 'react'

/**
 * When filters open in `<dialog showModal>`, portaled floating UI must mount
 * inside the dialog or it stays below the browser top layer and is invisible.
 */
export const FilterSheetFloatingRootRefContext = createContext<RefObject<HTMLDialogElement | null> | null>(
  null,
)
