import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Store } from 'lucide-react'
import { fetchPlatformStores, setStoreStatus } from '../api'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TRow, TH, TD } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonRows } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n'
import { formatMoney, formatDate } from '@/lib/utils'

export default function AdminStores() {
  const { success, error } = useToast()
  const { t } = useI18n()
  const [search, setSearch] = useState('')

  const { data: stores, isLoading, refetch } = useQuery({
    queryKey: ['platform-stores'],
    queryFn: fetchPlatformStores,
  })

  const filtered = useMemo(() => {
    let list = stores ?? []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          (s.owner_email ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [stores, search])

  const toggleStatus = async (storeId: string, current: string) => {
    const next = current === 'active' ? 'suspended' : 'active'
    try {
      await setStoreStatus(storeId, next)
      success(next === 'suspended' ? t('admin.storeSuspended') : t('admin.storeActivated'))
      refetch()
    } catch (e) {
      error(t('admin.couldNotUpdateStore'), (e as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('admin.storesTitle')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {t('admin.storesSubtitle')}
        </p>
      </div>

      <div className="w-full sm:w-72">
        <Input
          placeholder={t('admin.searchStores')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      <Card>
        {isLoading ? (
          <SkeletonRows count={8} className="p-5" />
        ) : !stores || stores.length === 0 ? (
          <EmptyState icon={<Store className="h-7 w-7 text-gray-400" />} title={t('admin.noStoresYet')} />
        ) : (
          <Table>
            <THead>
              <TRow>
                <TH>{t('common.store')}</TH>
                <TH>{t('admin.owner')}</TH>
                <TH>{t('common.status')}</TH>
                <TH className="text-center">{t('common.products')}</TH>
                <TH className="text-center">{t('common.orders')}</TH>
                <TH className="text-center">{t('common.customers')}</TH>
                <TH className="text-end">{t('admin.totalRevenue')}</TH>
                <TH>{t('common.created')}</TH>
                <TH className="w-32">{t('admin.action')}</TH>
              </TRow>
            </THead>
            <TBody>
              {filtered.map((store) => (
                <TRow key={store.id}>
                  <TD>
                    <p className="font-medium text-gray-900">{store.name}</p>
                    <p className="text-xs text-gray-400">/{store.slug}</p>
                  </TD>
                  <TD>
                    <div>
                      <p className="text-gray-700">{store.owner_name ?? '—'}</p>
                      {store.owner_email && <p className="text-xs text-gray-400">{store.owner_email}</p>}
                    </div>
                  </TD>
                  <TD>
                    <Badge variant={store.status === 'active' ? 'success' : 'danger'}>
                      {store.status === 'active' ? t('storeStatus.active') : t('storeStatus.suspended')}
                    </Badge>
                  </TD>
                  <TD className="text-center text-gray-600">{store.product_count}</TD>
                  <TD className="text-center text-gray-600">{store.order_count}</TD>
                  <TD className="text-center text-gray-600">{store.customer_count}</TD>
                  <TD className="text-end font-semibold text-gray-900">
                    {formatMoney(store.revenue, store.currency)}
                  </TD>
                  <TD className="text-gray-500">{formatDate(store.created_at)}</TD>
                  <TD>
                    {store.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(store.id, store.status)}
                      >
                        {t('admin.suspend')}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => toggleStatus(store.id, store.status)}>
                        {t('admin.activate')}
                      </Button>
                    )}
                  </TD>
                </TRow>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
