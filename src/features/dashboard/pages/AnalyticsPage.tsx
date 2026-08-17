import { useMemo, useState } from 'react'
import { DollarSign, ShoppingCart, TrendingUp, CalendarRange } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@/lib/store'
import { fetchDashboardStats } from '@/lib/api'
import { useAnalyticsQuery } from '@/lib/queries'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SalesChart, OrdersChart } from '@/components/ui/charts'
import { SkeletonRows } from '@/components/ui/spinner'
import { useI18n } from '@/lib/i18n'
import { formatMoney, cn } from '@/lib/utils'

const RANGES = [
  { key: 'today' },
  { key: '7d' },
  { key: '30d' },
  { key: '12m' },
] as const

type RangeKey = (typeof RANGES)[number]['key']

export default function AnalyticsPage() {
  const { currentStore } = useStore()
  const { t } = useI18n()
  const [range, setRange] = useState<RangeKey>('30d')
  const storeId = currentStore?.id ?? ''
  const currency = currentStore?.currency ?? 'USD'

  const { data: salesSeries } = useAnalyticsQuery(storeId, range)
  const series = useMemo(() => salesSeries ?? [], [salesSeries])

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', storeId],
    queryFn: () => fetchDashboardStats(storeId),
    enabled: Boolean(storeId),
  })

  const rangeRevenue = series.reduce((acc, s) => acc + s.revenue, 0)
  const rangeOrders = series.reduce((acc, s) => acc + s.orders, 0)
  const avgOrder = rangeOrders > 0 ? rangeRevenue / rangeOrders : 0
  const bestDay = series.length > 0 ? series.reduce((a, b) => (b.revenue > a.revenue ? b : a)) : null

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('analytics.title')}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
                range === r.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t(`range.${r.key}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !stats ? (
        <SkeletonRows count={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('analytics.revenue')}
              value={formatMoney(rangeRevenue, currency)}
              icon={<DollarSign className="h-5 w-5" />}
              trend={range === 'today' ? undefined : 0}
            />
            <StatCard
              label={t('analytics.orders')}
              value={rangeOrders.toLocaleString()}
              icon={<ShoppingCart className="h-5 w-5" />}
            />
            <StatCard
              label={t('analytics.averageOrderValue')}
              value={formatMoney(avgOrder, currency)}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label={t('analytics.bestDay')}
              value={bestDay ? formatMoney(bestDay.revenue, currency) : '—'}
              icon={<CalendarRange className="h-5 w-5" />}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.revenue')}</CardTitle>
              <CardDescription>{t('overview.revenueOverPeriod')}</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesChart data={series} currency={currency} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.orders')}</CardTitle>
              <CardDescription>{t('overview.ordersOverPeriod')}</CardDescription>
            </CardHeader>
            <CardContent>
              <OrdersChart data={series} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.lifetimeTotals')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Metric label={t('analytics.totalRevenue')} value={formatMoney(stats.totalRevenue, currency)} />
                <Metric label={t('analytics.totalOrders')} value={stats.totalOrders.toLocaleString()} />
                <Metric label={t('analytics.totalProducts')} value={stats.totalProducts.toLocaleString()} />
                <Metric label={t('analytics.totalCustomers')} value={stats.totalCustomers.toLocaleString()} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.bestSellingProducts')}</CardTitle>
              </CardHeader>
              {stats.bestSellers.length === 0 ? (
                <CardContent>
                  <p className="py-8 text-center text-sm text-gray-400">{t('analytics.noSalesData')}</p>
                </CardContent>
              ) : (
                <CardContent className="space-y-4">
                  {stats.bestSellers.map((item, idx) => (
                    <div key={item.product_name} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-50 text-xs font-bold text-primary-600">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-400">{t('overview.sold', { quantity: item.quantity })}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatMoney(item.total, currency)}
                      </p>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  )
}
