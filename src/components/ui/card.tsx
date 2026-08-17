import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-gray-200 bg-white shadow-sm', className)}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  children,
  action,
}: {
  className?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4',
        className,
      )}
    >
      <div>{children}</div>
      {action}
    </div>
  )
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-sm font-semibold text-gray-900', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-0.5 text-xs text-gray-500', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />
}
