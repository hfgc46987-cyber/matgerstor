import { Link, useOutletContext, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Trash2, ArrowRight } from 'lucide-react'
import { useCart } from '../cart-context'
import { useI18n } from '@/lib/i18n'
import { formatMoney } from '@/lib/utils'
import { Store, StoreSettings } from '@/lib/types'

interface OutletCtx {
  store: Store
  settings: StoreSettings | null
  theme: { primary: string }
}

export default function StorefrontCart() {
  const { store, theme } = useOutletContext<OutletCtx>()
  const { slug } = useParams<{ slug: string }>()
  const { t } = useI18n()
  const { items, count, subtotal, updateQuantity, removeItem } = useCart()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('cart.title')}</h1>
      {count > 0 && (
        <p className="mt-1 text-sm text-gray-500">
          {count === 1 ? t('cart.itemCount', { count }) : t('cart.itemCountPlural', { count })}
        </p>
      )}

      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm font-semibold text-gray-700">{t('cart.empty')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('cart.emptyDesc')}</p>
          <Link
            to={`/store/${slug}`}
            className="mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            {t('common.continueShopping')}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div key={item.product_id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/store/${slug}/product/${item.slug}`}
                    className="truncate text-sm font-semibold text-gray-900 hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-sm font-bold" style={{ color: theme.primary }}>
                    {formatMoney(item.price, store.currency)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center rounded-md border border-gray-200">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-gray-900"
                        aria-label={t('storefrontProduct.decrease')}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-gray-900"
                        aria-label={t('storefrontProduct.increase')}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={t('cart.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {formatMoney(item.price * item.quantity, store.currency)}
                </p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="sticky top-20 rounded-xl border border-gray-100 bg-white p-5">
              <h2 className="text-base font-bold text-gray-900">{t('cart.orderSummary')}</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>{t('common.subtotal')}</span>
                  <span className="font-medium text-gray-900">{formatMoney(subtotal, store.currency)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{t('common.shipping')}</span>
                  <span className="font-medium text-gray-900">{t('cart.calculatedAtCheckout')}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
                  <span>{t('common.total')}</span>
                  <span>{formatMoney(subtotal, store.currency)}</span>
                </div>
              </div>
              <Link
                to={`/store/${slug}/checkout`}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: theme.primary }}
              >
                {t('cart.proceedToCheckout')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link to={`/store/${slug}`} className="mt-3 block text-center text-xs font-medium text-gray-500 hover:text-gray-700">
                {t('common.continueShopping')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
