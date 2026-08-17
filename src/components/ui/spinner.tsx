import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-primary-600', className)} />
}

export function PageLoader({ label }: { label?: string }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-gray-500">{label ?? t('common.loading')}</p>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-gray-200', className)} />
}

export function SkeletonRows({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
