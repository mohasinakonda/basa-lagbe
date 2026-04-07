'use client'

import * as React from 'react'
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { FilterSheetFloatingRootRefContext } from '@/components/filters/FilterSheetFloatingRootContext'

export type FloatingSelectOption<T extends string> = {
  value: T
  label: string
}

export type FloatingSelectProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: FloatingSelectOption<T>[]
  ariaLabel: string
  buttonClassName?: string
  id?: string
}

export function FloatingSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  buttonClassName = '',
  id,
}: FloatingSelectProps<T>) {
  const [open, setOpen] = React.useState(false)
  const listboxId = React.useId()
  const selected = options.find((o) => o.value === value)
  const filterSheetDialogRef = React.useContext(FilterSheetFloatingRootRefContext)

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip(),
      shift({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          })
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'listbox' })
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const selectOption = (v: T) => {
    onChange(v)
    setOpen(false)
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        ref={refs.setReference}
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        className={`flex min-w-[7rem] items-center justify-between gap-2 rounded border border-[var(--foreground)]/25 bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--foreground)]/5 ${buttonClassName}`}
        {...getReferenceProps()}
      >
        <span>{selected?.label ?? value}</span>
        <span aria-hidden className="text-[var(--foreground)]/50">
          ▾
        </span>
      </button>
      {open && (
        <FloatingPortal root={filterSheetDialogRef ?? undefined}>
          <FloatingFocusManager context={context} modal={false} returnFocus>
            <div
              ref={refs.setFloating} // eslint-disable-line react-hooks/refs -- Floating UI setter
              id={listboxId}
              role="listbox"
              aria-labelledby={id}
              style={floatingStyles}
              className="z-[150] max-h-60 overflow-auto rounded-md border border-[var(--foreground)]/25 bg-[var(--background)] py-1 text-[var(--foreground)] shadow-lg outline-none"
              {...getFloatingProps()}
            >
              {options.map((opt) => (
                <div
                  key={String(opt.value)}
                  role="option"
                  aria-selected={opt.value === value}
                  className={`cursor-pointer px-3 py-2 text-sm text-[var(--foreground)] outline-none hover:bg-[var(--foreground)]/10 ${
                    opt.value === value ? 'bg-[var(--foreground)]/15 font-medium' : ''
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(opt.value)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  )
}
