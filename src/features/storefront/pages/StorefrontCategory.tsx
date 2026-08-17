import { Link, useOutletContext, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'
import { Store, StoreSettings } from '@/lib/types'
import { ProductCard } from './StorefrontHome'

interface OutletCtx {
  store: Store
  settings: StoreSettings | null
  theme: { primary: string; secondary: string; font: string; bannerUrl: string | null; designConfig?: StoreSettings['design_config'] }
}

export default function StorefrontCategory() {
  const { store, theme } = useOutletContext<OutletCtx>()
  const { slug, categorySlug } = useParams<{ slug: string; categorySlug: string }>()
  const { t } = useI18n()

  const { data: category } = useQuery({
    queryKey: ['storefront-category', slug, categorySlug],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .eq('slug', categorySlug!)
        .maybeSingle()
      return data ?? null
    },
    enabled: Boolean(store.id && categorySlug),
  })

  const { data: childIds } = useQuery({
    queryKey: ['storefront-category-children', category?.id],
    queryFn: async () => {
      if (!category) return [category?.id ?? '']
      const { data } = await supabase.from('categories').select('id').eq('parent_id', category.id)
      return [category.id, ...((data ?? []).map((r) => r.id) as string[])]
    },
    enabled: Boolean(category),
  })

  const { data: products } = useQuery({
    queryKey: ['storefront-category-products', slug, category?.id],
    queryFn: async () => {
      const ids = childIds ?? []
      if (ids.length === 0) return []
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('status', 'active')
        .in('category_id', ids)
        .order('created_at', { ascending: false })
        .limit(24)
      return data ?? []
    },
    enabled: Boolean(store.id && childIds && childIds.length > 0),
  })

  const { data: productImages } = useQuery({
    queryKey: ['storefront-cat-images', products?.map((p) => p.id).join(',')],
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-gray-400">
        <Link to={`/store/${slug}`} className="hover:text-gray-600">{t('common.home')}</Link>
        <ChevronRight className="h-3 w-3 rtl:rotate-180" />
        <span className="text-gray-600">{category?.name ?? categorySlug}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">{category?.name ?? t('category.category')}</h1>
      {category?.description && <p className="mt-1 text-sm text-gray-500">{category.description}</p>}

      {!products || products.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">{t('category.noProductsInCategory')}</p>
          <Link to={`/store/${slug}`} className="mt-3 inline-block text-sm font-medium" style={{ color: theme.primary }}>
            {t('category.browseAllProducts')}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              image={productImages?.[p.id]}
              currency={store.currency}
              storeSlug={slug ?? ''}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  )
}
