import { type ReactNode } from 'react'
import { PackageOpen } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        {icon ?? <PackageOpen className="h-7 w-7 text-gray-400" />}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <span className="text-2xl">⚠</span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title ?? t('ui.somethingWentWrong')}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {t('ui.tryAgain')}
        </button>
      )}
    </div>
  )
}
