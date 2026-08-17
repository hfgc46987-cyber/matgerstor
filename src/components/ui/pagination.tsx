import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const { t, dir } = useI18n()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pages: number[] = []
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    pages.push(i)
  }

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <p className="text-xs text-gray-500">
        {t('ui.showing', { from, to, total })}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t('ui.previousPage')}
        >
          <PrevIcon className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition',
              p === page
                ? 'bg-primary-600 text-white'
                : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t('ui.nextPage')}
        >
          <NextIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
