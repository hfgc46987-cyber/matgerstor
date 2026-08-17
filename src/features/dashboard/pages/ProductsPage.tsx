import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Package } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useStore } from '@/lib/store'
import { useProductsQuery, storeKeys, useCategoriesQuery } from '@/lib/queries'
import { deleteProduct } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge, productStatusVariant } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TRow, TH, TD } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonRows } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import { Product } from '@/lib/types'

const PAGE_SIZE = 12

export default function ProductsPage() {
  const { currentStore } = useStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const { t } = useI18n()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  const storeId = currentStore?.id ?? ''
  const currency = currentStore?.currency ?? 'USD'

  const { data, isLoading } = useProductsQuery(storeId, {
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status,
  })

  const productIds = data?.data.map((p) => p.id) ?? []

  const { data: imageMap } = useQuery({
    queryKey: ['product-thumbs', storeId, productIds.join(',')],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from('product_images')
        .select('product_id, url')
        .in('product_id', productIds)
        .order('position', { ascending: true })
      const map = new Map<string, string>()
      for (const row of rows ?? []) {
        if (!map.has(row.product_id)) map.set(row.product_id, row.url)
      }
      return map
    },
    enabled: productIds.length > 0,
  })

  const { data: categories } = useCategoriesQuery(storeId)
  const categoryMap = new Map(categories?.map((c) => [c.id, c.name]) ?? [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProduct(deleteTarget)
      success(t('products.productDeleted'), t('products.productDeletedMsg', { name: deleteTarget.name }))
      queryClient.invalidateQueries({ queryKey: storeKeys.products(storeId) })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', storeId] })
      setDeleteTarget(null)
    } catch (e) {
      error(t('products.couldNotDeleteProduct'), (e as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('products.title')}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{t('products.subtitle')}</p>
        </div>
        <Link to="/dashboard/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t('products.addProduct')}
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder={t('products.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="all">{t('products.allStatuses')}</option>
          <option value="active">{t('productStatus.active')}</option>
          <option value="draft">{t('productStatus.draft')}</option>
          <option value="archived">{t('productStatus.archived')}</option>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <SkeletonRows count={8} className="p-5" />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title={t('products.noProductsFound')}
            description={
              debouncedSearch || status !== 'all'
                ? t('products.adjustSearch')
                : t('products.addFirstProduct')
            }
            action={
              <Link to="/dashboard/products/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  {t('products.addYourFirstProduct')}
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <TRow>
                  <TH>{t('common.products')}</TH>
                  <TH>{t('common.status')}</TH>
                  <TH>{t('products.category')}</TH>
                  <TH>{t('products.stock')}</TH>
                  <TH>{t('common.price')}</TH>
                  <TH>{t('common.created')}</TH>
                  <TH className="w-10" />
                </TRow>
              </THead>
              <TBody>
                {data.data.map((product) => (
                  <TRow
                    key={product.id}
                    onClick={() => navigate(`/dashboard/products/${product.id}`)}
                  >
                    <TD>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {imageMap?.get(product.id) ? (
                            <img
                              src={imageMap.get(product.id)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="mx-auto mt-2.5 h-5 w-5 text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.sku ?? t('products.noSku')}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <Badge variant={productStatusVariant[product.status]}>{t(`productStatus.${product.status}`)}</Badge>
                    </TD>
                    <TD className="text-gray-500">
                      {product.category_id ? categoryMap.get(product.category_id) ?? '—' : '—'}
                    </TD>
                    <TD>
                      <span
                        className={cn(
                          'font-medium',
                          product.track_inventory && product.stock_quantity <= 5
                            ? 'text-red-600'
                            : 'text-gray-600',
                        )}
                      >
                        {product.track_inventory ? product.stock_quantity : '∞'}
                      </span>
                    </TD>
                    <TD>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatMoney(product.price, currency)}
                        </p>
                        {product.compare_price && product.compare_price > product.price && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatMoney(product.compare_price, currency)}
                          </p>
                        )}
                      </div>
                    </TD>
                    <TD className="text-gray-500">{formatDate(product.created_at)}</TD>
                    <TD onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        trigger={
                          <button className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        }
                      >
                        {(close) => (
                          <>
                            <DropdownItem
                              onClick={() => {
                                close()
                                navigate(`/dashboard/products/${product.id}`)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              {t('common.edit')}
                            </DropdownItem>
                            <DropdownItem
                              danger
                              onClick={() => {
                                close()
                                setDeleteTarget(product)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t('common.delete')}
                            </DropdownItem>
                          </>
                        )}
                      </Dropdown>
                    </TD>
                  </TRow>
                ))}
              </TBody>
            </Table>
            <div className="border-t border-gray-100">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={data.count}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('products.deleteConfirmTitle', { name: deleteTarget?.name ?? '' })}
        description={t('products.deleteConfirmDesc')}
        confirmLabel={t('products.deleteProduct')}
        danger
        loading={deleting}
      />
    </div>
  )
}
