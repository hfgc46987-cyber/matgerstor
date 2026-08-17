import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary-50 text-primary-700 ring-primary-600/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  neutral: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  purple: 'bg-violet-50 text-violet-700 ring-violet-600/20',
}

export function Badge({
  variant = 'default',
  className,
  children,
}: {
  variant?: BadgeVariant
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export const orderStatusVariant: Record<string, BadgeVariant> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'purple',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'neutral',
}

export const paymentStatusVariant: Record<string, BadgeVariant> = {
  unpaid: 'warning',
  paid: 'success',
  refunded: 'neutral',
}

export const productStatusVariant: Record<string, BadgeVariant> = {
  active: 'success',
  draft: 'neutral',
  archived: 'danger',
}
