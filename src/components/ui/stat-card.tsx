import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  onClick,
}: {
  label: string
  value: string | number
  icon: ReactNode
  trend?: number
  trendLabel?: string
  onClick?: () => void
}) {
  const { t } = useI18n()
  return (
    <Card
      className={cn('p-5', onClick && 'cursor-pointer transition hover:shadow-md')}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className={cn(
              'font-semibold',
              trend >= 0 ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {trend >= 0 ? '+' : ''}
            {trend}%
          </span>
          {trendLabel ?? t('ui.vsLastPeriod')}
        </p>
      )}
    </Card>
  )
}
