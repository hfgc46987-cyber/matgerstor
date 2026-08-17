import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Dropdown({
  trigger,
  children,
  align = 'right',
  className,
}: {
  trigger: ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'left' | 'right'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const close = () => setOpen(false)

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-40 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg animate-fade-in',
            align === 'right' ? 'end-0' : 'start-0',
            className,
          )}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({
  icon,
  children,
  onClick,
  danger,
  className,
}: {
  icon?: ReactNode
  children: ReactNode
  onClick?: () => void
  danger?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2 text-start text-sm transition hover:bg-gray-50',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700',
        className,
      )}
    >
      {icon && <span className="text-gray-400">{icon}</span>}
      {children}
    </button>
  )
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-gray-100" />
}
