import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Search, Boxes, AlertTriangle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useInventoryQuery, storeKeys } from '@/lib/queries'
import { updateStock } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TRow, TH, TD } from '@/components/ui/table'
import { Badge, productStatusVariant } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonRows } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n'
import { formatMoney, cn } from '@/lib/utils'

export default function InventoryPage() {
  const { currentStore } = useStore()
  const { t } = useI18n()
  const storeId = currentStore?.id ?? ''
  const currency = currentStore?.currency ?? 'USD'
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftStock, setDraftStock] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(t)
  }, [search])

  const { data: inventory, isLoading } = useInventoryQuery(storeId, debouncedSearch || undefined)

  const filtered = (inventory ?? []).filter((p) => (onlyLow ? p.track_inventory && p.stock_quantity <= 5 : true))
  const lowCount = (inventory ?? []).filter((p) => p.track_inventory && p.stock_quantity <= 5).length

  const saveStock = async (id: string) => {
    const value = Number(draftStock)
    if (Number.isNaN(value) || value < 0) {
      error(t('inventory.invalidStock'))
      return
    }
    try {
      await updateStock(id, value)
      success(t('inventory.stockUpdated'))
      queryClient.invalidateQueries({ queryKey: storeKeys.inventory(storeId) })
      queryClient.invalidateQueries({ queryKey: storeKeys.products(storeId) })
      setEditingId(null)
    } catch (e) {
      error(t('inventory.couldNotUpdateStock'), (e as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('inventory.title')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {t('inventory.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder={t('inventory.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <button
          onClick={() => setOnlyLow((v) => !v)}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition',
            onlyLow
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          {t('inventory.lowStockOnly')}
          {lowCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-bold text-amber-700">
              {lowCount}
            </span>
          )}
        </button>
      </div>

      <Card>
        {isLoading ? (
          <SkeletonRows count={8} className="p-5" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-7 w-7 text-gray-400" />}
            title={onlyLow ? t('inventory.noLowStock') : t('inventory.noInventory')}
            description={
              onlyLow
                ? t('inventory.noLowStockDesc')
                : t('inventory.noInventoryDesc')
            }
          />
        ) : (
          <Table>
            <THead>
              <TRow>
                <TH>{t('inventory.product')}</TH>
                <TH>{t('inventory.sku')}</TH>
                <TH>{t('common.status')}</TH>
                <TH>{t('inventory.tracked')}</TH>
                <TH className="text-end">{t('common.price')}</TH>
                <TH className="w-44 text-end">{t('products.stock')}</TH>
              </TRow>
            </THead>
            <TBody>
              {filtered.map((product) => (
                <TRow key={product.id}>
                  <TD>
                    <Link to={`/dashboard/products/${product.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                      {product.name}
                    </Link>
                  </TD>
                  <TD className="text-gray-500">{product.sku ?? '—'}</TD>
                  <TD>
                    <Badge variant={productStatusVariant[product.status]}>{t(`productStatus.${product.status}`)}</Badge>
                  </TD>
                  <TD className="text-gray-500">{product.track_inventory ? t('common.yes') : t('common.no')}</TD>
                  <TD className="text-end text-gray-700">{formatMoney(product.price, currency)}</TD>
                  <TD className="text-end">
                    {editingId === product.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          min="0"
                          autoFocus
                          value={draftStock}
                          onChange={(e) => setDraftStock(e.target.value)}
                          className="h-8 w-24 rounded-md border border-gray-300 px-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                        <Button size="sm" onClick={() => saveStock(product.id)}>
                          {t('common.save')}
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(product.id)
                          setDraftStock(String(product.stock_quantity))
                        }}
                        className={cn(
                          'inline-flex h-8 items-center rounded-md border px-2.5 text-sm font-medium transition hover:bg-gray-50',
                          product.track_inventory && product.stock_quantity <= 5
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-gray-200 bg-white text-gray-700',
                        )}
                        title={t('inventory.clickToEdit')}
                      >
                        {product.track_inventory ? product.stock_quantity : '—'}
                      </button>
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
