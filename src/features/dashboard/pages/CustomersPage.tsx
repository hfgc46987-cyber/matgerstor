import { useEffect, useState } from 'react'
import { Search, Users, Download } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useCustomersQuery } from '@/lib/queries'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TRow, TH, TD } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonRows } from '@/components/ui/spinner'
import { formatMoney, formatDate } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

const PAGE_SIZE = 15

export default function CustomersPage() {
  const { currentStore } = useStore()
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => setPage(1), [debouncedSearch])

  const storeId = currentStore?.id ?? ''
  const currency = currentStore?.currency ?? 'USD'

  const { data, isLoading } = useCustomersQuery(storeId, {
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
  })

  const handleExportCSV = () => {
    if (!data || data.data.length === 0) return
    const headers = ['Name', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Currency', 'Joined']
    const rows = data.data.map(customer => [
      `"${customer.name}"`,
      customer.email ?? '',
      customer.phone ?? '',
      customer.total_orders,
      customer.total_spent,
      currency,
      new Date(customer.created_at).toISOString()
    ])
    
    const csvContent = [headers.join(',')]
      .concat(rows.map(e => e.join(',')))
      .join('\n')
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'customers_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('customers.title')}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{t('customers.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={!data || data.data.length === 0} className="gap-2">
          <Download className="w-4 h-4" />
          {t('action.exportCsv')}
        </Button>
      </div>

      <div className="w-full sm:w-72">
        <Input
          placeholder={t('customers.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      <Card>
        {isLoading ? (
          <SkeletonRows count={8} className="p-5" />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7 text-gray-400" />}
            title={t('customers.noCustomersYet')}
            description={
              debouncedSearch
                ? t('customers.noMatchSearch')
                : t('customers.autoCreatedDesc')
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <TRow>
                  <TH>{t('overview.customer')}</TH>
                  <TH>{t('customers.contact')}</TH>
                  <TH>{t('common.orders')}</TH>
                  <TH>{t('customers.totalSpent')}</TH>
                  <TH>{t('common.joined')}</TH>
                </TRow>
              </THead>
              <TBody>
                {data.data.map((customer) => (
                  <TRow key={customer.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name} size="sm" />
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </div>
                    </TD>
                    <TD>
                      <div>
                        {customer.email && <p className="text-gray-600">{customer.email}</p>}
                        {customer.phone && <p className="text-xs text-gray-400">{customer.phone}</p>}
                      </div>
                    </TD>
                    <TD className="text-gray-600">{customer.total_orders}</TD>
                    <TD className="font-semibold text-gray-900">
                      {formatMoney(customer.total_spent, currency)}
                    </TD>
                    <TD className="text-gray-500">{formatDate(customer.created_at)}</TD>
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
