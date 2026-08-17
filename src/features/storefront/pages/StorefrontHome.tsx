import { Link, useOutletContext, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart, type CartItem } from '../cart-context'
import { useToast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n'
import { formatMoney } from '@/lib/utils'
import { Store, StoreSettings } from '@/lib/types'

interface OutletCtx {
  store: Store
  settings: StoreSettings | null
  theme: { primary: string; secondary: string; font: string; bannerUrl: string | null }
}

export default function StorefrontHome() {
  const { store, settings, theme } = useOutletContext<OutletCtx>()
  const { slug } = useParams<{ slug: string }>()
  const { t } = useI18n()

  const sections = settings?.homepage_sections ?? {
    show_banner: true,
    show_featured: true,
    show_categories: true,
    banner_heading: '',
    banner_subheading: '',
  }

  const { data: products, isLoading } = useQuery({
    queryKey: ['storefront-products', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(12)
      return (data as StoreProduct[]) ?? []
    },
    enabled: Boolean(store.id),
  })

  const { data: productImages } = useQuery({
    queryKey: ['storefront-images', slug, products?.map((p) => p.id).join(',')],
    queryFn: async () => {
      const ids = (products ?? []).map((p) => p.id)
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
    enabled: Boolean(products && products.length > 0),
  })

  const { data: categories } = useQuery({
    queryKey: ['storefront-categories', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: true })
        .limit(8)
      return data ?? []
    },
    enabled: Boolean(store.id),
  })

  const featured = (products ?? []).filter((p) => p.featured)
  const grid = featured.length > 0 ? featured : (products ?? [])

  return (
    <div>
      {/* Banner */}
      {sections.show_banner !== false && (
        <section
          className="relative flex items-center justify-center px-6 py-32 text-center overflow-hidden"
          style={{
            backgroundColor: theme.primary,
            backgroundImage: theme.bannerUrl 
              ? `url(${theme.bannerUrl})` 
              : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary} 150%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Subtle overlay pattern if no banner */}
          {!theme.bannerUrl && (
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          )}
          <div className="relative z-10 max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-sm">
              {sections.banner_heading || t('storefrontHome.welcomeTo', { store: store.name })}
            </h1>
            {sections.banner_subheading && (
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/90 sm:text-xl">
                {sections.banner_subheading}
              </p>
            )}
            {grid.length > 0 && (
              <a
                href="#products"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider shadow-lg transition hover:scale-105 hover:shadow-xl"
                style={{ color: theme.primary }}
              >
                {t('storefrontHome.shopNow')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </a>
            )}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Categories */}
        {sections.show_categories !== false && categories && categories.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-5 text-xl font-bold text-gray-900">{t('storefrontHome.shopByCategory')}</h2>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/store/${slug}/category/${cat.slug}`}
                  className="group flex flex-col items-center gap-3 text-center transition hover:-translate-y-1"
                >
                  <div
                    className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full shadow-sm transition-shadow group-hover:shadow-md sm:h-32 sm:w-32"
                    style={{
                      backgroundImage: cat.image_url ? `url(${cat.image_url})` : undefined,
                      backgroundColor: cat.image_url ? undefined : theme.primary,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {!cat.image_url && (
                      <span className="text-xl font-bold text-white sm:text-2xl">{cat.name.charAt(0)}</span>
                    )}
                  </div>
                  <p className="max-w-[100px] text-sm font-semibold text-gray-900 sm:max-w-[120px]">{cat.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Products */}
        <section id="products">
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            {sections.show_featured !== false && featured.length > 0 ? t('storefrontHome.featuredProducts') : t('storefrontHome.allProducts')}
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="aspect-square rounded-lg bg-gray-200" />
                  <div className="mt-3 h-3 w-3/4 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-1/4 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : (products ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 mb-4">
                <ShoppingBag className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('storefrontHome.noProductsAvailable')}</h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500">{t('storefrontHome.checkBackSoon')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {grid.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  image={productImages?.[product.id]}
                  currency={store.currency}
                  storeSlug={slug ?? ''}
                  theme={theme}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

interface StoreProduct {
  id: string
  name: string
  slug: string
  price: number
  compare_price: number | null
  featured: boolean
  stock_quantity: number
  track_inventory: boolean
  description: string | null
}

export function ProductCard({
  product,
  image,
  currency,
  storeSlug,
  theme,
}: {
  product: StoreProduct
  image?: string | null
  currency: string
  storeSlug: string
  theme: { primary: string }
}) {
  const { addItem } = useCart()
  const { success } = useToast()
  const { t } = useI18n()
  const outOfStock = product.track_inventory && product.stock_quantity <= 0

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: image ?? null,
      slug: product.slug,
      max_stock: product.track_inventory ? product.stock_quantity : undefined,
    } as CartItem)
    success(t('storefrontHome.addedToCart'), product.name)
  }

  return (
    <Link
      to={`/store/${storeSlug}/product/${product.slug}`}
      className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ShoppingBag className="h-10 w-10" />
          </div>
        )}
        {product.compare_price && product.compare_price > product.price && (
          <span
            className="absolute start-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            {t('storefrontHome.savePercent', { percent: Math.round((1 - product.price / product.compare_price) * 100) })}
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-bold text-gray-500">
            {t('common.outOfStock')}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-bold" style={{ color: theme.primary }}>
            {formatMoney(product.price, currency)}
          </span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-xs text-gray-400 line-through">
              {formatMoney(product.compare_price, currency)}
            </span>
          )}
        </div>
        <button
          onClick={addToCart}
          disabled={outOfStock}
          className="mt-2.5 w-full rounded-lg py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: theme.primary }}
        >
          {outOfStock ? t('common.outOfStock') : t('common.addToCart')}
        </button>
      </div>
    </Link>
  )
}
