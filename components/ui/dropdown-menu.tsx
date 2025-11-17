// ABOUTME: Dropdown menu component for contextual actions
// ABOUTME: Simple dropdown implementation with positioning

'use client'

import * as React from 'react'

interface DropdownMenuProps {
  children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="relative inline-block">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            return React.cloneElement(child, { onClick: () => setOpen(!open) } as any)
          }
          if (child.type === DropdownMenuContent && open) {
            return React.cloneElement(child, { onClose: () => setOpen(false) } as any)
          }
        }
        return null
      })}
    </div>
  )
}

export function DropdownMenuTrigger({
  asChild,
  children,
  onClick,
}: {
  asChild?: boolean
  children: React.ReactNode
  onClick?: () => void
}) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick } as any)
  }

  return <button onClick={onClick}>{children}</button>
}

export function DropdownMenuContent({
  align = 'start',
  children,
  onClose,
}: {
  align?: 'start' | 'end'
  children: React.ReactNode
  onClose?: () => void
}) {
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (onClose) {
        onClose()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [onClose])

  return (
    <div
      className={`absolute ${
        align === 'end' ? 'right-0' : 'left-0'
      } top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50`}
      onClick={(e) => e.stopPropagation()}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { onClose } as any)
        }
        return child
      })}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  onClick,
  onClose,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  onClose?: () => void
  disabled?: boolean
}) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
      if (onClose) {
        onClose()
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  )
}
