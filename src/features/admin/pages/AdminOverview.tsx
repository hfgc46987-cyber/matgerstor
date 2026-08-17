import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, Store, Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'
import { fetchPlatformStats } from '../api'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonRows } from '@/components/ui/spinner'
import { formatMoney } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export default function AdminOverview() {
  const { t } = useI18n()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: fetchPlatformStats,
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('admin.overviewTitle')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {t('admin.overviewSubtitle')}
        </p>
      </div>

      {isLoading || !stats ? (
        <SkeletonRows count={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('admin.totalUsers')}
              value={stats.total_users.toLocaleString()}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('admin.totalStores')}
              value={stats.total_stores.toLocaleString()}
              icon={<Store className="h-5 w-5" />}
            />
            <StatCard
              label={t('admin.totalProducts')}
              value={stats.total_products.toLocaleString()}
              icon={<Package className="h-5 w-5" />}
            />
            <StatCard
              label={t('admin.totalOrders')}
              value={stats.total_orders.toLocaleString()}
              icon={<ShoppingCart className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-medium text-gray-500">{t('admin.totalRevenue')}</p>
              <p className="mt-1.5 text-2xl font-bold text-gray-900">
                {formatMoney(stats.total_revenue)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium text-gray-500">{t('admin.revenueThisMonth')}</p>
              <p className="mt-1.5 text-2xl font-bold text-gray-900">
                {formatMoney(stats.month_revenue)}
              </p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">{t('admin.activeStores')}</p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-1.5 text-2xl font-bold text-gray-900">{stats.active_stores}</p>
              <p className="text-xs text-gray-400">{t('admin.suspended', { count: stats.suspended_stores })}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">{t('admin.newUsers30d')}</p>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <p className="mt-1.5 text-2xl font-bold text-gray-900">{stats.new_users_30d}</p>
              <p className="text-xs text-gray-400">{t('admin.newStores', { count: stats.new_stores_30d })}</p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.quickActions')}</CardTitle>
              <CardDescription>{t('admin.managePlatform')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                to="/admin/users"
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 transition hover:border-violet-200 hover:bg-violet-50"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('admin.manageUsers')}</p>
                  <p className="text-xs text-gray-500">{t('admin.viewAllAccounts')}</p>
                </div>
                <Users className="h-5 w-5 text-violet-500" />
              </Link>
              <Link
                to="/admin/stores"
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 transition hover:border-violet-200 hover:bg-violet-50"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('admin.manageStores')}</p>
                  <p className="text-xs text-gray-500">{t('admin.suspendOrActivate')}</p>
                </div>
                <Store className="h-5 w-5 text-violet-500" />
              </Link>
              <Link
                to="/admin/plans"
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 transition hover:border-violet-200 hover:bg-violet-50"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('admin.managePlans')}</p>
                  <p className="text-xs text-gray-500">{t('admin.subscriptionsPricing')}</p>
                </div>
                <Package className="h-5 w-5 text-violet-500" />
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
