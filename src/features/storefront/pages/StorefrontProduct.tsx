import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Minus, Plus, ShoppingCart, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '../cart-context'
import { useToast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n'
import { formatMoney, cn } from '@/lib/utils'
import { Store, StoreSettings } from '@/lib/types'
import { ProductCard } from './StorefrontHome'

interface OutletCtx {
  store: Store
  settings: StoreSettings | null
  theme: { primary: string; secondary: string; font: string; bannerUrl: string | null; designConfig?: StoreSettings['design_config'] }
}

export default function StorefrontProduct() {
  const { store, theme } = useOutletContext<OutletCtx>()
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>()
  const { addItem } = useCart()
  const { success } = useToast()
  const { t } = useI18n()
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  const { data: product, isLoading } = useQuery({
    queryKey: ['storefront-product', slug, productSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('slug', productSlug!)
        .eq('status', 'active')
        .maybeSingle()
      return data ?? null
    },
    enabled: Boolean(store.id && productSlug),
  })

  const { data: images } = useQuery({
    queryKey: ['storefront-product-images', product?.id],
    queryFn: async () => {
      if (!product) return []
      const { data } = await supabase
        .from('product_images')
        .select('url')
        .eq('product_id', product.id)
        .order('position', { ascending: true })
      return (data ?? []).map((r) => r.url)
    },
    enabled: Boolean(product),
  })

  const { data: related } = useQuery({
    queryKey: ['storefront-related', store.id, product?.category_id],
    queryFn: async () => {
      if (!product) return []
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('status', 'active')
        .eq('category_id', product.category_id ?? '00000000-0000-0000-0000-000000000000')
        .neq('id', product.id)
        .limit(4)
      return data ?? []
    },
    enabled: Boolean(product),
  })

  const { data: relatedImages } = useQuery({
    queryKey: ['storefront-related-images', related?.map((p) => p.id).join(',')],
    queryFn: async () => {
      const ids = (related ?? []).map((p) => p.id)
      if (ids.length === 0) return {} as Record<string, string>
      const { data } = await supabase
        .from('product_images')
        .select('product_id, url')
        .in('product_id', ids)
        .order('position', { ascending: true })
      const map: Record<string, string> = {}
      for (const row of data ?? []) {
        if (!map[row.product_id]) map[row.product_id] = row.url
      }
      return map
    },
    enabled: Boolean(related && related.length > 0),
  })

  useEffect(() => setActiveImage(0), [product?.id])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="aspect-square rounded-2xl bg-gray-200" />
          <div className="space-y-4">
            <div className="h-6 w-2/3 rounded bg-gray-200" />
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-24 w-full rounded bg-gray-100" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-lg font-semibold text-gray-900">{t('storefrontProduct.productNotFound')}</p>
        <Link to={`/store/${slug}`} className="mt-3 inline-block text-sm font-medium" style={{ color: theme.primary }}>
          {t('storefront.goToStorecraft')}
        </Link>
      </div>
    )
  }

  const outOfStock = product.track_inventory && product.stock_quantity <= 0
  const gallery = images && images.length > 0 ? images : [null]
  const activeUrl = gallery[activeImage] ?? null

  const handleAdd = () => {
    if (outOfStock) return
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: gallery[0] ?? null,
      slug: product.slug,
      max_stock: product.track_inventory ? product.stock_quantity : undefined,
    })
    success(t('storefrontHome.addedToCart'), `${quantity} × ${product.name}`)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-gray-400">
        <Link to={`/store/${slug}`} className="hover:text-gray-600">{t('common.home')}</Link>
        <ChevronRight className="h-3 w-3 rtl:rotate-180" />
        <span className="text-gray-600">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
            {activeUrl ? (
              <img src={activeUrl} alt={product.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-gray-300">
                <ShoppingCart className="h-16 w-16" />
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2">
              {gallery.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    'h-20 w-20 overflow-hidden rounded-lg border-2 transition',
                    activeImage === idx ? 'border-primary-500' : 'border-transparent hover:border-gray-300',
                  )}
                >
                  {url && <img src={url} alt="" className="h-full w-full object-cover" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold" style={{ color: theme.primary }}>
              {formatMoney(product.price, store.currency)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-lg text-gray-400 line-through">
                {formatMoney(product.compare_price, store.currency)}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-gray-400">
            {product.track_inventory
              ? outOfStock
                ? t('common.outOfStock')
                : t('storefrontProduct.inStockCount', { count: product.stock_quantity })
              : t('common.inStock')}
          </p>

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {product.description}
            </p>
          )}

          {product.sku && (
            <p className="mt-4 text-xs text-gray-400">{t('storefrontProduct.sku', { sku: product.sku })}</p>
          )}

          {/* Quantity + add */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-gray-300">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center text-gray-500 transition hover:text-gray-900"
                aria-label={t('storefrontProduct.decrease')}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={() =>
                  setQuantity((q) =>
                    product.track_inventory ? Math.min(q + 1, product.stock_quantity) : q + 1,
                  )
                }
                className="flex h-11 w-11 items-center justify-center text-gray-500 transition hover:text-gray-900"
                aria-label={t('storefrontProduct.increase')}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: theme.primary }}
            >
              <ShoppingCart className="h-4 w-4" />
              {outOfStock ? t('common.outOfStock') : t('common.addToCart')}
            </button>
          </div>

          <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
            <p>{t('storefrontProduct.shippingNote')}</p>
            <p className="mt-1">
              • {t('storefrontProduct.needHelp', {
                email: store.email ?? t('storefrontProduct.customerSupport'),
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Related */}
      {related && related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-5 text-xl font-bold text-gray-900">{t('storefrontProduct.youMightAlsoLike')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                image={relatedImages?.[p.id]}
                currency={store.currency}
                storeSlug={slug ?? ''}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
