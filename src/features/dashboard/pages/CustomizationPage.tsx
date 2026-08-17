import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Palette, Save } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useSettingsQuery, useProductsQuery, useCategoriesQuery, storeKeys } from '@/lib/queries'
import { updateSettings } from '@/lib/api'
import { supabase, PUBLIC_STORAGE_BASE } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/ui/image-upload'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { StoreSettings } from '@/lib/types'

const FONTS = ['Inter', 'Poppins', 'Playfair Display', 'Roboto', 'Lora', 'Montserrat']

const HOMEPAGE_DEFAULTS: StoreSettings['homepage_sections'] = {
  show_featured: true,
  show_categories: true,
  show_banner: true,
  banner_heading: '',
  banner_subheading: '',
}

export default function CustomizationPage() {
  const { currentStore, refreshSettings } = useStore()
  const { t } = useI18n()
  const storeId = currentStore?.id ?? ''
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [form, setForm] = useState<Partial<StoreSettings>>({})
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [social, setSocial] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const { data: settingsData, isLoading } = useSettingsQuery(storeId)
  const { data: products } = useProductsQuery(storeId, { pageSize: 4, status: 'active' })
  const { data: categories } = useCategoriesQuery(storeId)

  useEffect(() => {
    if (!settingsData) return
    setForm({
      primary_color: settingsData.primary_color,
      secondary_color: settingsData.secondary_color,
      font: settingsData.font,
      footer_text: settingsData.footer_text ?? '',
      homepage_sections: settingsData.homepage_sections,
    })
    setSocial(settingsData.social_links ?? {})
    setLogoUrl(currentStore?.logo_url ?? null)
    setBannerUrl(settingsData.banner_url ?? null)
    setFaviconUrl(settingsData.favicon_url ?? null)
  }, [settingsData, currentStore?.logo_url])

  const primary = form.primary_color ?? '#4f46e5'
  const secondary = form.secondary_color ?? '#111827'
  const font = form.font ?? 'Inter'

  const preview = {
    primary,
    secondary,
    font,
    showBanner: form.homepage_sections?.show_banner ?? true,
    bannerHeading: form.homepage_sections?.banner_heading ?? '',
    bannerSubheading: form.homepage_sections?.banner_subheading ?? '',
    showFeatured: form.homepage_sections?.show_featured ?? true,
    showCategories: form.homepage_sections?.show_categories ?? true,
    bannerUrl,
    footerText: form.footer_text ?? '',
    logo: logoUrl,
  }

  const handleSave = async () => {
    if (!storeId) return
    setSaving(true)
    try {
      let logo = logoUrl
      if (logoFile) {
        const path = `stores/${storeId}/branding/logo`
        await supabase.storage.from('store-assets').remove([path])
        const { error: upErr } = await supabase.storage.from('store-assets').upload(path, logoFile, { upsert: true })
        if (upErr) throw upErr
        logo = `${PUBLIC_STORAGE_BASE}/store-assets/${path}`
      }

      let banner = bannerUrl
      if (bannerFile) {
        const path = `stores/${storeId}/branding/banner`
        await supabase.storage.from('store-assets').remove([path])
        const { error: upErr } = await supabase.storage.from('store-assets').upload(path, bannerFile, { upsert: true })
        if (upErr) throw upErr
        banner = `${PUBLIC_STORAGE_BASE}/store-assets/${path}`
      }

      let favicon = faviconUrl
      if (faviconFile) {
        const path = `stores/${storeId}/branding/favicon`
        await supabase.storage.from('store-assets').remove([path])
        const { error: upErr } = await supabase.storage.from('store-assets').upload(path, faviconFile, { upsert: true })
        if (upErr) throw upErr
        favicon = `${PUBLIC_STORAGE_BASE}/store-assets/${path}`
      }

      const patch: Partial<StoreSettings> = {
        ...form,
        banner_url: banner,
        favicon_url: favicon,
        social_links: social,
      }
      await updateSettings(storeId, patch)

      if (currentStore && logo) {
        await supabase.from('stores').update({ logo_url: logo }).eq('id', storeId)
      }

      success(t('customization.customizationSaved'), t('customization.customizationSavedMsg'))
      queryClient.invalidateQueries({ queryKey: storeKeys.settings(storeId) })
      await refreshSettings()
    } catch (e) {
      error(t('customization.couldNotSaveCustomization'), (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div className="flex justify-center py-24"><Spinner /></div>

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('customization.title')}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {t('customization.subtitle')}
          </p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" />
          {t('common.saveChanges')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> {t('customization.branding')}
              </CardTitle>
              <CardDescription>{t('customization.brandingDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <ImageUpload
                  label={t('customization.logo')}
                  value={logoUrl}
                  onChange={(url, file) => {
                    setLogoUrl(url)
                    setLogoFile(file ?? null)
                  }}
                  onClear={() => {
                    setLogoUrl(null)
                    setLogoFile(null)
                  }}
                />
                <ImageUpload
                  label={t('customization.favicon')}
                  value={faviconUrl}
                  onChange={(url, file) => {
                    setFaviconUrl(url)
                    setFaviconFile(file ?? null)
                  }}
                  onClear={() => {
                    setFaviconUrl(null)
                    setFaviconFile(null)
                  }}
                />
              </div>
              <ImageUpload
                label={t('customization.banner')}
                aspect="banner"
                hint={t('customization.bannerHint')}
                value={bannerUrl}
                onChange={(url, file) => {
                  setBannerUrl(url)
                  setBannerFile(file ?? null)
                }}
                onClear={() => {
                  setBannerUrl(null)
                  setBannerFile(null)
                }}
              />
            </CardContent>
          </Card>

          {/* Colors & font */}
          <Card>
            <CardHeader>
              <CardTitle>{t('customization.colorsTypography')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('customization.primaryColor')}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primary}
                      onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-gray-300 bg-white"
                    />
                    <Input value={primary} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>{t('customization.secondaryColor')}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondary}
                      onChange={(e) => setForm((f) => ({ ...f, secondary_color: e.target.value }))}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-gray-300 bg-white"
                    />
                    <Input value={secondary} onChange={(e) => setForm((f) => ({ ...f, secondary_color: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="font">{t('customization.font')}</Label>
                <select
                  id="font"
                  value={font}
                  onChange={(e) => setForm((f) => ({ ...f, font: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Homepage sections */}
          <Card>
            <CardHeader>
              <CardTitle>{t('customization.homepageSections')}</CardTitle>
              <CardDescription>{t('customization.homepageSectionsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                label={t('customization.showBanner')}
                checked={preview.showBanner}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    homepage_sections: { ...HOMEPAGE_DEFAULTS, ...(f.homepage_sections ?? {}), show_banner: v },
                  }))
                }
              />
              {preview.showBanner && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="bannerHeading">{t('customization.bannerHeading')}</Label>
                    <Input
                      id="bannerHeading"
                      value={preview.bannerHeading}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          homepage_sections: { ...HOMEPAGE_DEFAULTS, ...(f.homepage_sections ?? {}), banner_heading: e.target.value },
                        }))
                      }
                      placeholder={t('customization.bannerHeadingPlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bannerSub">{t('customization.bannerSubheading')}</Label>
                    <Input
                      id="bannerSub"
                      value={preview.bannerSubheading}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          homepage_sections: { ...HOMEPAGE_DEFAULTS, ...(f.homepage_sections ?? {}), banner_subheading: e.target.value },
                        }))
                      }
                      placeholder={t('customization.bannerSubheadingPlaceholder')}
                    />
                  </div>
                </div>
              )}
              <ToggleRow
                label={t('customization.showFeatured')}
                checked={preview.showFeatured}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    homepage_sections: { ...HOMEPAGE_DEFAULTS, ...(f.homepage_sections ?? {}), show_featured: v },
                  }))
                }
              />
              <ToggleRow
                label={t('customization.showCategories')}
                checked={preview.showCategories}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    homepage_sections: { ...HOMEPAGE_DEFAULTS, ...(f.homepage_sections ?? {}), show_categories: v },
                  }))
                }
              />
            </CardContent>
          </Card>

          {/* Footer & social */}
          <Card>
            <CardHeader>
              <CardTitle>{t('customization.footerSocial')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="footer">{t('customization.footerText')}</Label>
                <Input
                  id="footer"
                  value={form.footer_text ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, footer_text: e.target.value }))}
                  placeholder={t('customization.footerPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {['facebook', 'instagram', 'twitter', 'tiktok', 'youtube'].map((platform) => (
                  <div key={platform}>
                    <Label htmlFor={`social-${platform}`} className="capitalize">
                      {platform}
                    </Label>
                    <Input
                      id={`social-${platform}`}
                      value={social[platform] ?? ''}
                      onChange={(e) => setSocial((s) => ({ ...s, [platform]: e.target.value }))}
                      placeholder={`https://${platform}.com/…`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div>
          <div className="sticky top-20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Live preview
            </p>
            <StorefrontPreview
              storeName={currentStore?.name ?? 'My Store'}
              storeSlug={currentStore?.slug ?? ''}
              currency={currentStore?.currency ?? 'USD'}
              products={products?.data ?? []}
              categories={categories ?? []}
              preview={preview}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-primary-600' : 'bg-gray-300')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'start-[22px]' : 'start-0.5')} />
      </button>
    </label>
  )
}

function StorefrontPreview({
  storeName,
  storeSlug,
  currency,
  products,
  categories,
  preview,
}: {
  storeName: string
  storeSlug: string
  currency: string
  products: { id: string; name: string; price: number; compare_price: number | null }[]
  categories: { id: string; name: string }[]
    preview: {
    primary: string
    secondary: string
    font: string
    showBanner: boolean
    bannerHeading: string
    bannerSubheading: string
    showFeatured: boolean
    showCategories: boolean
    bannerUrl: string | null
    footerText: string
    logo: string | null
  }
}) {
  const { t } = useI18n()
  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
      style={{ fontFamily: preview.font }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: preview.secondary }}>
        <div className="flex items-center gap-2.5">
          {preview.logo ? (
            <img src={preview.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: preview.primary }}>
              {storeName.charAt(0)}
            </div>
          )}
          <span className="text-sm font-bold text-white">{storeName}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-300">
          <span>{t('common.shop')}</span>
          <span>{t('common.cart')}</span>
        </div>
      </div>

      {/* Banner */}
      {preview.showBanner && (
        <div
          className="relative flex items-center justify-center px-6 py-8 text-center"
          style={{
            backgroundImage: preview.bannerUrl ? `url(${preview.bannerUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: preview.primary,
          }}
        >
          <div className="relative">
            <p className="text-lg font-bold text-white">{preview.bannerHeading || t('customization.welcomeToOurStore')}</p>
            {preview.bannerSubheading && (
              <p className="mt-1 text-xs text-white/80">{preview.bannerSubheading}</p>
            )}
            <button
              className="mt-3 rounded-lg bg-white px-4 py-1.5 text-xs font-semibold"
              style={{ color: preview.primary }}
            >
              {t('customization.shopNow')}
            </button>
          </div>
        </div>
      )}

      <div className="px-5 py-4">
        {/* Categories */}
        {preview.showCategories && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-bold text-gray-800">{t('common.categories')}</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.slice(0, 6).map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full px-3 py-1 text-[10px] font-medium"
                  style={{ backgroundColor: `${preview.primary}15`, color: preview.primary }}
                >
                  {cat.name}
                </span>
              ))}
              {categories.length === 0 && (
                <span className="text-[11px] text-gray-400">{t('customization.addCategoriesInDashboard')}</span>
              )}
            </div>
          </div>
        )}

        {/* Products */}
        {preview.showFeatured && (
          <div>
            <p className="mb-2 text-xs font-bold text-gray-800">{t('customization.featuredProducts')}</p>
            <div className="grid grid-cols-3 gap-2">
              {products.slice(0, 3).length > 0
                ? products.slice(0, 3).map((p, i) => (
                    <div key={p.id ?? `ph-${i}`} className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <div className="mb-1.5 h-14 rounded-md bg-gray-200" />
                      <p className="truncate text-[10px] font-medium text-gray-700">{p.name ?? t('customization.yourProduct')}</p>
                      <p className="text-[10px] font-bold" style={{ color: preview.primary }}>
                        {p.price != null ? formatMoneyShort(p.price, currency) : '—'}
                      </p>
                    </div>
                  ))
                : Array.from({ length: 3 }).map((_, i) => (
                    <div key={`ph-${i}`} className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <div className="mb-1.5 h-14 rounded-md bg-gray-200" />
                      <p className="truncate text-[10px] font-medium text-gray-700">{t('customization.yourProduct')}</p>
                      <p className="text-[10px] font-bold" style={{ color: preview.primary }}>
                        —
                      </p>
                    </div>
                  ))}
            </div>
            {products.length === 0 && (
              <p className="mt-1 text-[11px] text-gray-400">
                {t('customization.addActiveProducts')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 text-center text-[10px] text-white" style={{ backgroundColor: preview.secondary }}>
        {preview.footerText || `© ${new Date().getFullYear()} ${storeName}`}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-3 py-1.5 text-center text-[10px] text-gray-400">
        /store/{storeSlug}
      </div>
    </div>
  )
}

function formatMoneyShort(amount: number, currency: string) {
  return `${currency === 'USD' ? '$' : currency} ${amount.toFixed(2)}`
}
