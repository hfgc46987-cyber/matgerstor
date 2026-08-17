import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Timer,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useStore } from '@/lib/store'
import { fetchDashboardStats } from '@/lib/api'
import { useAnalyticsQuery } from '@/lib/queries'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, orderStatusVariant } from '@/components/ui/badge'
import { SalesChart, OrdersChart } from '@/components/ui/charts'
import { SkeletonRows } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { formatMoney, formatDateTime, cn } from '@/lib/utils'

const RANGES = [
  { key: 'today' },
  { key: '7d' },
  { key: '30d' },
  { key: '12m' },
] as const

type RangeKey = (typeof RANGES)[number]['key']

export default function OverviewPage() {
  const { t } = useI18n()
  const { currentStore } = useStore()
  const navigate = useNavigate()
  const [range, setRange] = useState<RangeKey>('30d')

  const storeId = currentStore?.id ?? ''
  const currency = currentStore?.currency ?? 'USD'

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', storeId],
    queryFn: () => fetchDashboardStats(storeId),
    enabled: Boolean(storeId),
  })

  const { data: salesSeries } = useAnalyticsQuery(storeId, range)

  const series = useMemo(() => salesSeries ?? [], [salesSeries])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('overview.title')}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {t('overview.subtitle', { store: currentStore?.name ?? '' })}
          </p>
        </div>
        <Link
          to="/dashboard/products/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
        >
          <Package className="h-4 w-4" />
          {t('overview.addProduct')}
        </Link>
      </div>

      {isLoading || !stats ? (
        <SkeletonRows count={6} />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('overview.totalRevenue')}
              value={formatMoney(stats.totalRevenue, currency)}
              icon={<DollarSign className="h-5 w-5" />}
            />
            <StatCard
              label={t('overview.totalOrders')}
              value={stats.totalOrders.toLocaleString()}
              icon={<ShoppingCart className="h-5 w-5" />}
              onClick={() => navigate('/dashboard/orders')}
            />
            <StatCard
              label={t('overview.products')}
              value={stats.totalProducts.toLocaleString()}
              icon={<Package className="h-5 w-5" />}
              onClick={() => navigate('/dashboard/products')}
            />
            <StatCard
              label={t('overview.customers')}
              value={stats.totalCustomers.toLocaleString()}
              icon={<Users className="h-5 w-5" />}
              onClick={() => navigate('/dashboard/customers')}
            />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">{t('overview.salesToday')}</p>
                <Timer className="h-4 w-4 text-gray-400" />
              </div>
              <p className="mt-1.5 text-lg font-bold text-gray-900">
                {formatMoney(stats.todayRevenue, currency)}
              </p>
              <p className="text-xs text-gray-400">{t('overview.ordersCount', { count: stats.todayOrders })}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">{t('overview.salesThisMonth')}</p>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
              <p className="mt-1.5 text-lg font-bold text-gray-900">
                {formatMoney(stats.monthRevenue, currency)}
              </p>
              <p className="text-xs text-gray-400">{t('overview.ordersCount', { count: stats.monthOrders })}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">{t('overview.pendingOrders')}</p>
                <ShoppingCart className="h-4 w-4 text-gray-400" />
              </div>
              <p className="mt-1.5 text-lg font-bold text-gray-900">{stats.pendingOrders}</p>
              <p className="text-xs text-gray-400">{t('overview.awaitingConfirmation')}</p>
            </Card>
            <Card
              className="cursor-pointer p-5 transition hover:shadow-md"
              onClick={() => navigate('/dashboard/inventory')}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">{t('overview.lowStock')}</p>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-1.5 text-lg font-bold text-gray-900">{stats.lowStockProducts.length}</p>
              <p className="text-xs text-gray-400">{t('overview.atOrBelowUnits')}</p>
            </Card>
          </div>

          {/* Charts */}
          <Card>
            <CardHeader
              action={
                <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                  {RANGES.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setRange(r.key)}
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition',
                        range === r.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                      )}
                    >
                      {t(`range.${r.key}`)}
                    </button>
                  ))}
                </div>
              }
            >
              <CardTitle>{t('overview.sales')}</CardTitle>
              <CardDescription>{t('overview.revenueOverPeriod')}</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesChart data={series} currency={currency} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('overview.orders')}</CardTitle>
              <CardDescription>{t('overview.ordersOverPeriod')}</CardDescription>
            </CardHeader>
            <CardContent>
              <OrdersChart data={series} />
            </CardContent>
          </Card>

          {/* Recent orders + best sellers */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                action={
                  <Link to="/dashboard/orders" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                    {t('common.viewAll')}
                  </Link>
                }
              >
                <CardTitle>{t('overview.recentOrders')}</CardTitle>
              </CardHeader>
              {stats.recentOrders.length === 0 ? (
                <EmptyState
                  title={t('overview.noOrdersYet')}
                  description={t('overview.noOrdersDesc')}
                  action={
                    <Link to="/dashboard/products">
                      <span className="text-sm font-medium text-primary-600 hover:text-primary-700">
                        {t('overview.addProductsToStart')}
                      </span>
                    </Link>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-start text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <th className="px-5 py-3">{t('overview.order')}</th>
                        <th className="px-5 py-3">{t('overview.customer')}</th>
                        <th className="px-5 py-3">{t('common.date')}</th>
                        <th className="px-5 py-3">{t('common.status')}</th>
                        <th className="px-5 py-3 text-end">{t('common.total')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stats.recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                          className="cursor-pointer transition hover:bg-gray-50"
                        >
                          <td className="px-5 py-3 font-medium text-gray-900">{order.order_number}</td>
                          <td className="px-5 py-3 text-gray-600">{order.customer?.name ?? t('common.guest')}</td>
                          <td className="px-5 py-3 text-gray-500">{formatDateTime(order.created_at)}</td>
                          <td className="px-5 py-3">
                            <Badge variant={orderStatusVariant[order.status]}>
                              {t(`status.${order.status}`)}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-end font-semibold text-gray-900">
                            {formatMoney(order.total, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('overview.bestSellers')}</CardTitle>
              </CardHeader>
              {stats.bestSellers.length === 0 ? (
                <EmptyState title={t('overview.noSalesYet')} description={t('overview.noSalesDesc')} />
              ) : (
                <CardContent className="space-y-4">
                  {stats.bestSellers.map((item, idx) => (
                    <div key={item.product_name} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-400">
                          {t('overview.sold', { quantity: item.quantity })} · {formatMoney(item.total, currency)}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-300" />
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
