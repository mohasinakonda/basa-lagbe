'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'

type DropdownMenuContextValue = {
  close: () => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

export type DropdownMenuProps = {
  trigger: React.ReactNode
  /** @default 'end' */
  align?: 'start' | 'end'
  id?: string
  triggerClassName?: string
  children: React.ReactNode
}

export function DropdownMenu({
  trigger,
  align = 'end',
  id = 'site-menu',
  triggerClassName,
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: align === 'end' ? 'bottom-end' : 'bottom-start',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'menu' })
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const close = React.useCallback(() => setOpen(false), [])

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        ref={refs.setReference}
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        id={`${id}-trigger`}
        {...getReferenceProps()}
      >
        {trigger}
      </button>
      {open && (
        <FloatingFocusManager
          context={context}
          modal={false}
          initialFocus={-1}
          closeOnFocusOut={false}
        >
          <div
            // eslint-disable-next-line react-hooks/refs
            ref={refs.setFloating}
            id={`${id}-menu`}
            role="menu"
            aria-labelledby={`${id}-trigger`}
            style={floatingStyles}
            className="z-[200] min-w-[12rem] rounded-xl border border-border bg-surface py-1 shadow-dialog outline-none"
            {...getFloatingProps()}
          >
            <DropdownMenuContext.Provider value={{ close }}>{children}</DropdownMenuContext.Provider>
          </div>
        </FloatingFocusManager>
      )}
    </div>
  )
}

type DropdownMenuItemProps = {
  href?: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const itemClass =
  'flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm text-foreground hover:bg-muted focus:bg-muted focus:outline-none rounded-md'

export function DropdownMenuItem({
  href,
  children,
  className = '',
  onClick,
}: DropdownMenuItemProps) {
  const ctx = React.useContext(DropdownMenuContext)

  const merged = `${itemClass} ${className}`.trim()

  const handleActivate = () => {
    ctx?.close()
    onClick?.()
  }

  if (href) {
    return (
      <Link href={href} role="menuitem" className={merged} onClick={handleActivate}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" role="menuitem" className={merged} onClick={handleActivate}>
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border" role="separator" />
}
