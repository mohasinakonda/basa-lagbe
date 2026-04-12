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
import { ChevronDown } from '@/assets/icons/chevron-down'

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

const triggerBase =
  'flex min-w-[7rem] items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

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
        className={`${triggerBase} ${buttonClassName}`}
        {...getReferenceProps()}
      >
        <span>{selected?.label ?? value}</span>
        <span aria-hidden className="text-muted-foreground">
          <ChevronDown className="shrink-0 opacity-60" />
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
              className='z-150 max-h-60 overflow-auto rounded-xl border border-border bg-surface py-1 text-foreground shadow-dialog'

              {...getFloatingProps()}
            >
              {options.map((opt) => (
                <div
                  key={String(opt.value)}
                  role="option"
                  aria-selected={opt.value === value}
                  className={`cursor-pointer px-3 py-2 text-sm text-foreground outline-none hover:bg-muted ${opt.value === value ? 'bg-muted font-medium' : ''
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
