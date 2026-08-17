import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Download } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useOrdersQuery } from '@/lib/queries'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge, orderStatusVariant, paymentStatusVariant } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TRow, TH, TD } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonRows } from '@/components/ui/spinner'
import { useI18n } from '@/lib/i18n'
import { formatMoney, formatDateTime } from '@/lib/utils'

const STATUSES = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const PAGE_SIZE = 15

export default function OrdersPage() {
  const { currentStore } = useStore()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => setPage(1), [status, debouncedSearch])

  const storeId = currentStore?.id ?? ''
  const currency = currentStore?.currency ?? 'USD'

  const { data, isLoading } = useOrdersQuery(storeId, {
    page,
    pageSize: PAGE_SIZE,
    status,
    search: debouncedSearch || undefined,
  })

  const handleExportCSV = () => {
    if (!data || data.data.length === 0) return
    const headers = ['Order Number', 'Customer', 'Email', 'Date', 'Status', 'Payment Status', 'Total', 'Currency']
    const rows = data.data.map(order => [
      order.order_number,
      `"${order.customer?.name ?? t('common.guest')}"`,
      order.customer?.email ?? '',
      new Date(order.created_at).toISOString(),
      order.status,
      order.payment_status,
      order.total,
      order.currency
    ])
    
    const csvContent = [headers.join(',')]
      .concat(rows.map(e => e.join(',')))
      .join('\n')
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'orders_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('orders.title')}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{t('orders.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={!data || data.data.length === 0} className="gap-2">
          <Download className="w-4 h-4" />
          {t('action.exportCsv')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder={t('orders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? t('orders.allStatuses') : t(`status.${s}`)}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <SkeletonRows count={8} className="p-5" />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-7 w-7 text-gray-400" />}
            title={t('orders.noOrdersFound')}
            description={
              status !== 'all' || debouncedSearch
                ? t('orders.noMatchFilters')
                : t('orders.noOrdersDesc')
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <TRow>
                  <TH>{t('overview.order')}</TH>
                  <TH>{t('overview.customer')}</TH>
                  <TH>{t('common.date')}</TH>
                  <TH>{t('common.status')}</TH>
                  <TH>{t('orders.payment')}</TH>
                  <TH className="text-end">{t('common.total')}</TH>
                </TRow>
              </THead>
              <TBody>
                {data.data.map((order) => (
                  <TRow key={order.id} onClick={() => navigate(`/dashboard/orders/${order.id}`)}>
                    <TD className="font-medium text-gray-900">{order.order_number}</TD>
                    <TD>
                      <div>
                        <p className="text-gray-700">{order.customer?.name ?? t('common.guest')}</p>
                        {order.customer?.email && (
                          <p className="text-xs text-gray-400">{order.customer.email}</p>
                        )}
                      </div>
                    </TD>
                    <TD className="text-gray-500">{formatDateTime(order.created_at)}</TD>
                    <TD>
                      <Badge variant={orderStatusVariant[order.status]}>{t(`status.${order.status}`)}</Badge>
                    </TD>
                    <TD>
                      <Badge variant={paymentStatusVariant[order.payment_status]}>
                        {t(`paymentStatus.${order.payment_status}`)}
                      </Badge>
                    </TD>
                    <TD className="text-end font-semibold text-gray-900">
                      {formatMoney(order.total, order.currency || currency)}
                    </TD>
                  </TRow>
                ))}
              </TBody>
            </Table>
            <div className="border-t border-gray-100">
              <Pagination page={page} pageSize={PAGE_SIZE} total={data.count} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
