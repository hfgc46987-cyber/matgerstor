import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Package } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Store } from '@/lib/types'

interface OutletCtx {
  store: Store
  theme: { primary: string }
}

export default function StorefrontOrderSuccess() {
  const { store, theme } = useOutletContext<OutletCtx>()
  const { t } = useI18n()
  const [params] = useSearchParams()
  const orderNumber = params.get('number') ?? ''

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-gray-900">{t('orderSuccess.title')}</h1>
      {orderNumber && (
        <p className="mt-2 text-sm text-gray-500">
          {t('orderSuccess.received', { number: orderNumber })}
        </p>
      )}
      <p className="mt-1 text-sm text-gray-500">
        {t('orderSuccess.emailed')}
      </p>

      <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Package className="h-5 w-5" />
          </div>
          <div className="text-start">
            <p className="text-sm font-semibold text-gray-900">{t('orderSuccess.keepEye')}</p>
            <p className="text-xs text-gray-400">{t('orderSuccess.updates')}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Link
          to={`/store/${store.slug}`}
          className="inline-flex items-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: theme.primary }}
        >
          {t('common.continueShopping')}
        </Link>
        <Link to="/" className="text-xs font-medium text-gray-400 hover:text-gray-600">
          {t('orderSuccess.backToStorecraft')}
        </Link>
      </div>
    </div>
  )
}
