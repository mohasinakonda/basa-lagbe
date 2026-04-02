'use client'

import * as React from 'react'
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react'

export type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
  /** ms */
  delay?: number
  placement?: 'top' | 'bottom' | 'left' | 'right'
  id?: string
}

export function Tooltip({
  content,
  children,
  delay = 400,
  placement = 'top',
  id,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false)
  const tooltipId = React.useId()
  const labelId = id ?? `tip-${tooltipId}`

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, {
    move: false,
    delay: { open: delay, close: 0 },
  })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role])

  return (
    <>
      <span ref={refs.setReference} className="inline-flex" {...getReferenceProps()}>
        {children}
      </span>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating} // eslint-disable-line react-hooks/refs -- Floating UI setter
            id={labelId}
            role="tooltip"
            style={floatingStyles}
            className="z-[250] max-w-xs rounded-md border border-[var(--foreground)]/15 bg-[var(--foreground)] px-2 py-1.5 text-xs text-[var(--background)] shadow-md"
            {...getFloatingProps()}
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
