import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, User, StickyNote } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useOrderQuery, storeKeys } from '@/lib/queries'
import { updateOrderStatus, updatePaymentStatus } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge, orderStatusVariant, paymentStatusVariant } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { SkeletonRows } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n'
import { formatMoney, formatDateTime } from '@/lib/utils'
import { OrderStatus } from '@/lib/types'

const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { currentStore } = useStore()
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const { t } = useI18n()
  const storeId = currentStore?.id ?? ''

  const { data: order, isLoading, isError } = useOrderQuery(storeId, id)

  if (isLoading) return <SkeletonRows count={8} className="mx-auto max-w-5xl" />
  if (isError || !order) {
    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-sm text-gray-500">{t('orderDetail.orderNotFound')}</p>
        <Link to="/dashboard/orders" className="mt-2 inline-block text-sm font-medium text-primary-600">
          {t('orderDetail.backToOrders')}
        </Link>
      </div>
    )
  }

  const currency = order.currency || currentStore?.currency || 'USD'

  const handleStatusChange = async (value: string) => {
    try {
      await updateOrderStatus(order.id, value as OrderStatus)
      success(t('orderDetail.orderUpdated'), t('orderDetail.statusChanged', { status: t(`status.${value}`) }))
      queryClient.invalidateQueries({ queryKey: storeKeys.order(storeId, order.id) })
      queryClient.invalidateQueries({ queryKey: storeKeys.orders(storeId) })
    } catch (e) {
      error(t('orderDetail.couldNotUpdateOrder'), (e as Error).message)
    }
  }

  const handlePaymentChange = async (value: string) => {
    try {
      await updatePaymentStatus(order.id, value as 'unpaid' | 'paid' | 'refunded')
      success(t('orderDetail.paymentUpdated'), t('orderDetail.paymentMarked', { status: t(`paymentStatus.${value}`) }))
      queryClient.invalidateQueries({ queryKey: storeKeys.order(storeId, order.id) })
    } catch (e) {
      error(t('orderDetail.couldNotUpdatePayment'), (e as Error).message)
    }
  }

  const address = order.shipping_address as Record<string, string> | null

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/orders"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-sm text-gray-500">{formatDateTime(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">{t('orderDetail.status')}</p>
            <Select value={order.status} onChange={(e) => handleStatusChange(e.target.value)} className="w-40">
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">{t('orderDetail.payment')}</p>
            <Select value={order.payment_status} onChange={(e) => handlePaymentChange(e.target.value)} className="w-32">
              <option value="unpaid">{t('paymentStatus.unpaid')}</option>
              <option value="paid">{t('paymentStatus.paid')}</option>
              <option value="refunded">{t('paymentStatus.refunded')}</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Badge variant={orderStatusVariant[order.status]}>{t(`status.${order.status}`)}</Badge>
        <Badge variant={paymentStatusVariant[order.payment_status]}>{t(`paymentStatus.${order.payment_status}`)}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('orderDetail.items')}</CardTitle>
              <CardDescription>{t('orderDetail.itemsSnapshot')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-500">
                      {item.quantity}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-xs text-gray-400">
                        {formatMoney(item.price, currency)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatMoney(item.total, currency)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-gray-100 bg-gray-50/50 px-5 py-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>{t('common.subtotal')}</span>
                  <span>{formatMoney(order.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{t('common.shipping')}</span>
                  <span>{formatMoney(order.shipping_cost, currency)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>{t('common.discount')}</span>
                    <span>-{formatMoney(order.discount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
                  <span>{t('common.total')}</span>
                  <span>{formatMoney(order.total, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4" /> {t('orderDetail.orderNotes')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" /> {t('orderDetail.customer')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.customer ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                  {order.customer.email && <p className="text-sm text-gray-500">{order.customer.email}</p>}
                  {order.customer.phone && <p className="text-sm text-gray-500">{order.customer.phone}</p>}
                  <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-400">
                    <p>{t('orderDetail.totalOrders', { count: order.customer.total_orders })}</p>
                    <p>{t('orderDetail.lifetimeSpent', { amount: formatMoney(order.customer.total_spent, currency) })}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">{t('orderDetail.guestCheckout')}</p>
              )}
            </CardContent>
          </Card>

          {address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {t('orderDetail.shippingAddress')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-gray-600">
                {address.name && <p className="font-medium text-gray-900">{address.name}</p>}
                {address.line1 && <p>{address.line1}</p>}
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {[address.city, address.state].filter(Boolean).join(', ')}
                  {address.postal_code ? ` ${address.postal_code}` : ''}
                </p>
                {address.country && <p>{address.country}</p>}
                {address.phone && <p className="pt-1 text-gray-500">{address.phone}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
