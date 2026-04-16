'use client'

import React, { useCallback, useEffect, useState } from 'react'

export interface HomeSearchFieldProps {
  id: string
  className?: string
  initialQuery: string
  onCommit: (query: string) => void
}

/**
 * Local draft + debounced commit to URL (keeps heavy state out of the page shell).
 */
export function HomeSearchField({ id, className, initialQuery, onCommit }: HomeSearchFieldProps) {
  const [draft, setDraft] = useState(initialQuery)

  useEffect(() => {
    setDraft(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (draft.trim() !== initialQuery.trim()) {
        onCommit(draft.trim())
      }
    }, 400)
    return () => window.clearTimeout(handle)
  }, [draft, initialQuery, onCommit])

  const onChange = useCallback((value: string) => {
    setDraft(value)
  }, [])

  return (
    <input
      id={id}
      type="search"
      placeholder="Search title, address…"
      value={draft}
      onChange={(event) => onChange(event.target.value)}
      className={className}
      autoComplete="off"
    />
  )
}
