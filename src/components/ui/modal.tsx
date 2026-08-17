import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-t-2xl bg-white shadow-xl animate-slide-up sm:rounded-xl',
          {
            'sm:max-w-sm': size === 'sm',
            'sm:max-w-lg': size === 'md',
            'sm:max-w-2xl': size === 'lg',
            'sm:max-w-4xl': size === 'xl',
          },
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
            <div>
              {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
              {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
