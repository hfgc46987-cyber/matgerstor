import { useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ShoppingCart, Store as StoreIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'
import { LangSwitcher } from '@/components/ui/lang-switcher'
import { CartProvider, useCart } from './cart-context'
import { Store, StoreSettings, Category } from '@/lib/types'

export default function Storefront() {
  return <StorefrontShell />
}

function StorefrontShell() {
  const { slug } = useParams<{ slug: string }>()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ id: string; name: string; slug: string; price: number }[]>([])
  const [searching, setSearching] = useState(false)

  const { t } = useI18n()

  const { data: store, isLoading, isError } = useQuery({
    queryKey: ['storefront', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug!)
        .maybeSingle()
      return (data as Store) ?? null
    },
    enabled: Boolean(slug),
  })

  const { data: settings } = useQuery({
    queryKey: ['storefront-settings', slug],
    queryFn: async () => {
      if (!store) return null
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', store.id)
        .maybeSingle()
      return (data as StoreSettings) ?? null
    },
    enabled: Boolean(store),
  })

  const { data: categories } = useQuery({
    queryKey: ['storefront-categories', slug],
    queryFn: async () => {
      if (!store) return []
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .is('parent_id', null)
        .order('created_at', { ascending: true })
        .limit(6)
      return (data as Category[]) ?? []
    },
    enabled: Boolean(store),
  })

  const theme = {
    primary: settings?.primary_color ?? '#4f46e5',
    secondary: settings?.secondary_color ?? '#111827',
    font: settings?.font ?? 'Inter',
    bannerUrl: settings?.banner_url ?? null,
    customCss: settings?.custom_css ?? '',
    customHead: settings?.custom_head_html ?? '',
    layoutStyle: settings?.layout_style ?? 'default',
    designConfig: settings?.design_config ?? {},
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !store || store.status !== 'active') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <StoreIcon className="h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">{t('storefront.storeNotFound')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('storefront.storeUnavailable')}
        </p>
        <Link to="/" className="mt-5 text-sm font-semibold text-primary-600 hover:text-primary-700">
          {t('storefront.goToStorecraft')}
        </Link>
      </div>
    )
  }

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (!value.trim()) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price')
      .eq('store_id', store.id)
      .eq('status', 'active')
      .ilike('name', `%${value}%`)
      .limit(8)
    setResults((data as { id: string; name: string; slug: string; price: number }[]) ?? [])
    setSearching(false)
  }

  return (
    <CartProvider storeSlug={store.slug}>
      {theme.customCss && <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />}
      {theme.customHead && <div dangerouslySetInnerHTML={{ __html: theme.customHead }} />}
      <div className={`min-h-screen ${theme.layoutStyle === 'minimal' ? 'bg-white' : 'bg-gray-50'}`} style={{ fontFamily: theme.font }}>
        {/* Announcement Bar */}
        {settings?.announcement_active && settings.announcement_text && (
          <div 
            className="px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm"
            style={{ backgroundColor: theme.primary }}
          >
            {settings.announcement_link ? (
              <a href={settings.announcement_link} className="hover:underline flex items-center justify-center gap-2">
                <span>{settings.announcement_text}</span>
              </a>
            ) : (
              <span>{settings.announcement_text}</span>
            )}
          </div>
        )}

        {/* Header */}
        <header
          className="sticky top-0 z-30"
          style={{ backgroundColor: theme.secondary, color: '#fff' }}
        >
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
            <Link to={`/store/${store.slug}`} className="flex min-w-0 items-center gap-2.5">
              {store.logo_url ? (
                <img 
                  src={store.logo_url} 
                  alt={store.name} 
                  className={`rounded-lg object-cover ${theme.designConfig.logo_size === 'small' ? 'h-8 w-8' : theme.designConfig.logo_size === 'large' ? 'h-14 w-auto' : 'h-10 w-auto max-w-[120px]'}`}
                />
              ) : (
                <div
                  className={`flex items-center justify-center rounded-lg text-sm font-bold ${theme.designConfig.logo_size === 'small' ? 'h-8 w-8' : theme.designConfig.logo_size === 'large' ? 'h-14 w-14 text-xl' : 'h-10 w-10'}`}
                  style={{ backgroundColor: theme.primary }}
                >
                  {store.name.charAt(0)}
                </div>
              )}
              <span className="truncate text-base font-bold">{store.name}</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium text-gray-200 md:flex">
              <NavLink
                to={`/store/${store.slug}`}
                end
                className="transition hover:text-white"
              >
                {t('common.home')}
              </NavLink>              {categories?.map((cat) => (
                <NavLink
                  key={cat.id}
                  to={`/store/${store.slug}/category/${cat.slug}`}
                  className="transition hover:text-white"
                >
                  {cat.name}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <LangSwitcher dark />
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t('storefront.searchPlaceholder')}
                  className="h-9 w-44 rounded-lg border-0 bg-white/10 ps-9 pe-3 text-sm text-white placeholder:text-gray-300 focus:bg-white focus:text-gray-900 focus:outline-none"
                />
                {query && (
                  <div className="absolute end-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl bg-white text-gray-900 shadow-xl">
                    {searching ? (
                      <p className="px-4 py-3 text-sm text-gray-400">{t('storefront.searching')}</p>
                    ) : results.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">{t('storefront.noProductsFound')}</p>
                    ) : (
                      results.map((p) => (
                        <Link
                          key={p.id}
                          to={`/store/${store.slug}/product/${p.slug}`}
                          onClick={() => setQuery('')}
                          className="flex items-center justify-between px-4 py-2.5 text-sm transition hover:bg-gray-50"
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="ms-3 shrink-0 font-semibold" style={{ color: theme.primary }}>
                            ${p.price.toFixed(2)}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
              <CartButton storeSlug={store.slug} />
            </div>
          </div>
        </header>

        <main>
          <Outlet context={{ store, settings, theme }} />
        </main>

        {/* Footer */}
        <footer
          className="mt-12"
          style={{ backgroundColor: theme.secondary, color: '#9ca3af' }}
        >
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                {store.logo_url && (
                  <img src={store.logo_url} alt="" className="h-6 w-6 rounded object-cover" />
                )}
                <span className="text-sm font-semibold text-white">{store.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {settings?.social_links && (
                  <>
                    {settings.social_links.facebook && (
                      <a href={settings.social_links.facebook} target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a>
                    )}
                    {settings.social_links.instagram && (
                      <a href={settings.social_links.instagram} target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>
                    )}
                    {settings.social_links.twitter && (
                      <a href={settings.social_links.twitter} target="_blank" rel="noreferrer" className="hover:text-white">Twitter</a>
                    )}
                  </>
                )}
              </div>
            </div>
            <p className="mt-5 text-center text-xs">
              {settings?.footer_text ?? `${t('storefront.allRightsReserved')}`}
            </p>
            <p className="mt-2 text-center text-[10px]">
              {t('storefront.poweredBy')} <span className="text-gray-400">{t('app.name')}</span>
            </p>
          </div>
        </footer>
      </div>
    </CartProvider>
  )
}

function CartButton({ storeSlug }: { storeSlug: string }) {
  const { count } = useCart()
  const { t } = useI18n()
  return (
    <Link
      to={`/store/${storeSlug}/cart`}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
      aria-label={t('common.cart')}
    >
      <ShoppingCart className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: '#ef4444' }}>
          {count}
        </span>
      )}
    </Link>
  )
}
