import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Palette, Save, Image as ImageIcon, Layout, Settings2, Check, ChevronUp, ChevronDown } from 'lucide-react'
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
import { AiDesignAssistant } from '../components/AiDesignAssistant'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { StoreSettings } from '@/lib/types'

const FONTS = ['Inter', 'Poppins', 'Playfair Display', 'Roboto', 'Lora', 'Montserrat', 'Tajawal', 'Cairo']

const COLOR_PRESETS = [
  { name: 'Ocean', primary: '#0ea5e9', secondary: '#0f172a' },
  { name: 'Sunset', primary: '#f97316', secondary: '#431407' },
  { name: 'Emerald', primary: '#10b981', secondary: '#064e3b' },
  { name: 'Rose', primary: '#f43f5e', secondary: '#4c0519' },
  { name: 'Midnight', primary: '#6366f1', secondary: '#1e1b4b' },
  { name: 'Monochrome', primary: '#000000', secondary: '#f3f4f6' },
]

const HOMEPAGE_DEFAULTS: StoreSettings['homepage_sections'] = {
  show_featured: true,
  show_categories: true,
  show_banner: true,
  banner_heading: '',
  banner_subheading: '',
}

type TabId = 'branding' | 'colors' | 'layout' | 'advanced'

export default function CustomizationPage() {
  const { currentStore, refreshSettings, refreshStores } = useStore()
  const { t } = useI18n()
  const storeId = currentStore?.id ?? ''
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [activeTab, setActiveTab] = useState<TabId>('branding')
  const [form, setForm] = useState<Partial<StoreSettings>>({})
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [social, setSocial] = useState<Record<string, string>>({})
  const [customCss, setCustomCss] = useState<string>('')
  const [customHead, setCustomHead] = useState<string>('')
  const [customBody, setCustomBody] = useState<string>('')
  const [layoutStyle, setLayoutStyle] = useState<string>('default')
  const [designConfig, setDesignConfig] = useState<StoreSettings['design_config']>({})
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
    setCustomCss(settingsData.custom_css ?? '')
    setCustomHead(settingsData.custom_head_html ?? '')
    setCustomBody(settingsData.custom_body_html ?? '')
    setLayoutStyle(settingsData.layout_style ?? 'default')
    setDesignConfig(settingsData.design_config ?? {})
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
        custom_css: customCss,
        custom_head_html: customHead,
        custom_body_html: customBody,
        layout_style: layoutStyle,
        design_config: designConfig,
      }
      await updateSettings(storeId, patch)

      if (currentStore && logo) {
        await supabase.from('stores').update({ logo_url: logo }).eq('id', storeId)
      }

      success(t('customization.customizationSaved') ?? 'Saved', t('customization.customizationSavedMsg') ?? 'Your store design has been successfully updated.')
      queryClient.invalidateQueries({ queryKey: storeKeys.settings(storeId) })
      await refreshSettings()
      await refreshStores()
    } catch (e) {
      error(t('customization.couldNotSaveCustomization') ?? 'Error', (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div className="flex justify-center py-24"><Spinner /></div>

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('customization.title') ?? 'Store Customization'}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {t('customization.subtitle') ?? 'Personalize your storefront design and layout.'}
          </p>
        </div>
        <Button onClick={handleSave} loading={saving} size="lg" className="shadow-sm">
          <Save className="h-4 w-4 me-2" />
          {t('common.saveChanges') ?? 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* Horizontal Tabs */}
          <div className="flex space-x-6 border-b border-gray-200 overflow-x-auto pb-px rtl:space-x-reverse">
            <TabButton 
              id="branding" 
              label={t('customization.branding') ?? 'Images & Branding'} 
              icon={<ImageIcon className="w-4 h-4" />} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
            <TabButton 
              id="colors" 
              label={t('customization.colorsTypography') ?? 'Colors & Typography'} 
              icon={<Palette className="w-4 h-4" />} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
            <TabButton 
              id="layout" 
              label={t('customization.homepageSections') ?? 'Layout & Sections'} 
              icon={<Layout className="w-4 h-4" />} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
            <TabButton 
              id="advanced" 
              label={t('customization.advanced') ?? 'Advanced Settings'} 
              icon={<Settings2 className="w-4 h-4" />} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
          </div>

          <div className="py-4">
            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="border-0 shadow-sm ring-1 ring-gray-200/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('customization.branding') ?? 'Brand Assets'}</CardTitle>
                    <CardDescription>{t('customization.brandingDesc') ?? 'Upload your logo, favicon, and a beautiful banner.'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ImageUpload
                        label={t('customization.logo') ?? 'Store Logo'}
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
                        label={t('customization.favicon') ?? 'Favicon (Browser Icon)'}
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
                      label={t('customization.banner') ?? 'Welcome Banner Image'}
                      aspect="banner"
                      hint={t('customization.bannerHint') ?? 'Recommended size: 1200x400px'}
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

                <Card className="border-0 shadow-sm ring-1 ring-gray-200/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('customization.footerSocial') ?? 'Footer & Social Media'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <Label htmlFor="footer">{t('customization.footerText') ?? 'Footer Text'}</Label>
                      <Input
                        id="footer"
                        value={form.footer_text ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, footer_text: e.target.value }))}
                        placeholder={t('customization.footerPlaceholder') ?? '© 2024 My Store. All rights reserved.'}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            )}

            {/* Colors & Typography Tab */}
            {activeTab === 'colors' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="border-0 shadow-sm ring-1 ring-gray-200/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('customization.colorsTypography') ?? 'Colors & Typography'}</CardTitle>
                    <CardDescription>Choose a premium color palette or customize your own.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    
                    {/* Preset Palettes */}
                    <div>
                      <Label className="mb-3 block text-sm font-medium text-gray-700">Preset Palettes</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, primary_color: preset.primary, secondary_color: preset.secondary }))}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-md",
                              primary === preset.primary && secondary === preset.secondary 
                                ? "border-primary-600 ring-1 ring-primary-600 bg-primary-50" 
                                : "border-gray-200 bg-white hover:border-primary-300"
                            )}
                          >
                            <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-gray-200 shadow-sm">
                              <div className="h-full w-1/2" style={{ backgroundColor: preset.primary }} />
                              <div className="h-full w-1/2" style={{ backgroundColor: preset.secondary }} />
                            </div>
                            <span className="text-sm font-medium text-gray-800">{preset.name}</span>
                            {primary === preset.primary && secondary === preset.secondary && (
                              <Check className="w-4 h-4 text-primary-600 ms-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                      <div>
                        <Label className="mb-2 block">{t('customization.primaryColor') ?? 'Primary Color'}</Label>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 overflow-hidden rounded-lg shadow-sm border border-gray-200 cursor-pointer">
                            <input
                              type="color"
                              value={primary}
                              onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                              className="absolute -inset-2 h-20 w-24 cursor-pointer"
                            />
                          </div>
                          <Input className="font-mono uppercase h-12" value={primary} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block">{t('customization.secondaryColor') ?? 'Secondary Color'}</Label>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 overflow-hidden rounded-lg shadow-sm border border-gray-200 cursor-pointer">
                            <input
                              type="color"
                              value={secondary}
                              onChange={(e) => setForm((f) => ({ ...f, secondary_color: e.target.value }))}
                              className="absolute -inset-2 h-20 w-24 cursor-pointer"
                            />
                          </div>
                          <Input className="font-mono uppercase h-12" value={secondary} onChange={(e) => setForm((f) => ({ ...f, secondary_color: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <Label htmlFor="font" className="mb-2 block">{t('customization.font') ?? 'Typography'}</Label>
                      <div className="relative">
                        <select
                          id="font"
                          value={font}
                          onChange={(e) => setForm((f) => ({ ...f, font: e.target.value }))}
                          className="h-12 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                          style={{ fontFamily: font }}
                        >
                          {FONTS.map((f) => (
                            <option key={f} value={f} style={{ fontFamily: f }}>
                              {f}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-4 text-gray-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Layout Tab */}
            {activeTab === 'layout' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="border-0 shadow-sm ring-1 ring-gray-200/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('customization.homepageSections') ?? 'Homepage Sections'}</CardTitle>
                    <CardDescription>{t('customization.homepageSectionsDesc') ?? 'Toggle sections to show on your storefront.'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(designConfig.section_order ?? ['banner', 'categories', 'featured']).map((sectionId, index, array) => {
                      const isFirst = index === 0
                      const isLast = index === array.length - 1
                      const moveUp = () => {
                        const newOrder = [...array]
                        ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
                        setDesignConfig(prev => ({ ...prev, section_order: newOrder }))
                      }
                      const moveDown = () => {
                        const newOrder = [...array]
                        ;[newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]]
                        setDesignConfig(prev => ({ ...prev, section_order: newOrder }))
                      }

                      if (sectionId === 'banner') {
                        return (
                          <div key="banner" className="space-y-3">
                            <SectionRow
                              label={t('customization.showBanner') ?? 'Show Welcome Banner'}
                              checked={preview.showBanner}
                              onChange={(v) => setForm(f => ({ ...f, homepage_sections: { ...HOMEPAGE_DEFAULTS, ...(f.homepage_sections ?? {}), show_banner: v } }))}
                              onMoveUp={moveUp}
                              onMoveDown={moveDown}
                              isFirst={isFirst}
                              isLast={isLast}
                            />
                            {preview.showBanner && (
                              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 ms-4">
                                <div>
                                  <Label htmlFor="bannerHeading">{t('customization.bannerHeading') ?? 'Banner Heading'}</Label>
                                  <Input
                                    id="bannerHeading"
                                    value={preview.bannerHeading}
                                    onChange={(e) => setForm(f => ({ ...f, homepage_sections: { ...HOMEPAGE_DEFAULTS, ...(f.homepage_sections ?? {}), banner_heading: e.target.value } }))}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="bannerSub">{t('customization.bannerSubheading') ?? 'Banner Subheading'}</Label>
                                  <Input
                                    id="bannerSub"
                                    value={preview.bannerSubheading}
                                    onChange={(e) => setForm(f => ({ ...f, homepage_sections: { ...HOMEPAGE_DEFAULTS, ...(f.homepage_sections ?? {}), banner_subheading: e.target.value } }))}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }
                      if (sectionId === 'categories') {
                        return (
                          <SectionRow
                            key="categories"
                            label={t('customization.showCategories') ?? 'Show Categories'}
                            checked={preview.showCategories}
                            onChange={(v) => setForm(f => ({ ...f, homepage_sections: { ...HOMEPAGE_DEFAULTS, ...(f.homepage_sections ?? {}), show_categories: v } }))}
                            onMoveUp={moveUp}
                            onMoveDown={moveDown}
                            isFirst={isFirst}
                            isLast={isLast}
                          />
                        )
                      }
                      if (sectionId === 'featured') {
                        return (
                          <SectionRow
                            key="featured"
                            label={t('customization.showFeatured') ?? 'Show Featured Products'}
                            checked={preview.showFeatured}
                            onChange={(v) => setForm(f => ({ ...f, homepage_sections: { ...HOMEPAGE_DEFAULTS, ...(f.homepage_sections ?? {}), show_featured: v } }))}
                            onMoveUp={moveUp}
                            onMoveDown={moveDown}
                            isFirst={isFirst}
                            isLast={isLast}
                          />
                        )
                      }
                      return null
                    })}
                  </CardContent>
                </Card>

                {/* Advanced Design */}
                <Card className="border-0 shadow-sm ring-1 ring-gray-200/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('customization.advancedDesign') ?? 'Advanced Design Elements'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="mb-2 block">{t('customization.logoSize') ?? 'Logo Size'}</Label>
                      <select
                        value={designConfig?.logo_size ?? 'medium'}
                        onChange={(e) => setDesignConfig(prev => ({ ...prev, logo_size: e.target.value as any }))}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      >
                        <option value="small">{t('common.small') ?? 'Small'}</option>
                        <option value="medium">{t('common.medium') ?? 'Medium'}</option>
                        <option value="large">{t('common.large') ?? 'Large'}</option>
                      </select>
                    </div>
                    <div>
                      <Label className="mb-2 block">{t('customization.productImageRatio') ?? 'Product Image Ratio'}</Label>
                      <select
                        value={designConfig?.product_image_ratio ?? 'square'}
                        onChange={(e) => setDesignConfig(prev => ({ ...prev, product_image_ratio: e.target.value as any }))}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      >
                        <option value="square">{t('customization.square') ?? 'Square (1:1)'}</option>
                        <option value="portrait">{t('customization.portrait') ?? 'Portrait (3:4)'}</option>
                        <option value="landscape">{t('customization.landscape') ?? 'Landscape (4:3)'}</option>
                      </select>
                    </div>
                    <div>
                      <Label className="mb-2 block">{t('customization.categoryShape') ?? 'Category Shape'}</Label>
                      <select
                        value={designConfig?.category_shape ?? 'circle'}
                        onChange={(e) => setDesignConfig(prev => ({ ...prev, category_shape: e.target.value as any }))}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      >
                        <option value="circle">{t('customization.circle') ?? 'Circle'}</option>
                        <option value="rounded">{t('customization.rounded') ?? 'Rounded Square'}</option>
                        <option value="square">{t('customization.squareShape') ?? 'Sharp Square'}</option>
                      </select>
                    </div>
                    <div>
                      <Label className="mb-2 block">Button Style</Label>
                      <select
                        value={designConfig?.button_style ?? 'pill'}
                        onChange={(e) => setDesignConfig(prev => ({ ...prev, button_style: e.target.value as any }))}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      >
                        <option value="pill">Pill (Fully rounded)</option>
                        <option value="rounded">Rounded</option>
                        <option value="square">Square</option>
                      </select>
                    </div>
                    <div>
                      <Label className="mb-2 block">Card Style</Label>
                      <select
                        value={designConfig?.card_style ?? 'border'}
                        onChange={(e) => setDesignConfig(prev => ({ ...prev, card_style: e.target.value as any }))}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      >
                        <option value="border">Bordered</option>
                        <option value="shadow">Shadows (No border)</option>
                        <option value="flat">Flat (Minimal)</option>
                      </select>
                    </div>
                    <div>
                      <Label className="mb-2 block">Header Layout</Label>
                      <select
                        value={designConfig?.header_layout ?? 'logo-left'}
                        onChange={(e) => setDesignConfig(prev => ({ ...prev, header_layout: e.target.value as any }))}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      >
                        <option value="logo-left">Logo on Left</option>
                        <option value="logo-center">Logo Centered</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="border-0 shadow-sm ring-1 ring-gray-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="h-2 w-2 rounded-full bg-primary-600" /> {t('customization.advanced') || 'Developer Settings'}
                    </CardTitle>
                    <CardDescription>{t('customization.advancedDesc') || 'Inject custom CSS and HTML scripts for complete control.'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="layoutStyle" className="mb-2 block">{t('customization.layoutStyle') || 'Layout Style'}</Label>
                      <select
                        id="layoutStyle"
                        value={layoutStyle}
                        onChange={(e) => setLayoutStyle(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      >
                        <option value="default">Default</option>
                        <option value="minimal">Minimal (Clean, less borders)</option>
                        <option value="bold">Bold (Darker headers, sharp corners)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="customCss" className="mb-2 block">Custom CSS</Label>
                      <textarea
                        id="customCss"
                        value={customCss}
                        onChange={(e) => setCustomCss(e.target.value)}
                        className="h-40 w-full font-mono text-xs rounded-lg border border-gray-700 bg-gray-900 text-green-400 p-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="body { background-color: #f0f0f0; }"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customHead" className="mb-2 block">Custom Head HTML (Scripts, Pixels)</Label>
                      <textarea
                        id="customHead"
                        value={customHead}
                        onChange={(e) => setCustomHead(e.target.value)}
                        className="h-28 w-full font-mono text-xs rounded-lg border border-gray-700 bg-gray-900 text-blue-400 p-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="<script src='https://analytics.example.com/js'></script>"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-24 pt-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Live preview
              </p>
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-green-400"></span>
              </div>
            </div>
            
            <div className="ring-1 ring-gray-900/10 rounded-2xl p-1 bg-white shadow-2xl transition-all duration-500">
              <StorefrontPreview
                storeName={currentStore?.name ?? 'My Store'}
                storeSlug={currentStore?.slug ?? ''}
                currency={currentStore?.currency ?? 'USD'}
                products={products?.data ?? []}
                categories={categories ?? []}
                preview={preview}
                designConfig={designConfig}
              />
            </div>
          </div>
        </div>
      </div>
      <AiDesignAssistant 
        currentForm={{ ...form, design_config: designConfig }} 
        onUpdateForm={(newForm) => { 
          setForm(newForm); 
          if(newForm.design_config) setDesignConfig(newForm.design_config); 
        }} 
      />
    </div>
  )
}

function TabButton({ id, label, icon, activeTab, setActiveTab }: { id: TabId, label: string, icon: React.ReactNode, activeTab: TabId, setActiveTab: (id: TabId) => void }) {
  const isActive = activeTab === id
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-2 px-1 pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        isActive ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function SectionRow({
  label,
  checked,
  onChange,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst?: boolean
  isLast?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex-1 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:bg-gray-50 transition-colors">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2', checked ? 'bg-green-500' : 'bg-gray-200')}
        >
          <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', checked ? 'translate-x-5' : 'translate-x-0.5 mt-0.5')} />
        </button>
      </label>
      {onMoveUp && onMoveDown && (
        <div className="flex flex-col gap-1 shrink-0">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}


function StorefrontPreview({
  storeName,
  storeSlug,
  currency,
  products,
  categories,
  preview,
  designConfig,
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
  },
  designConfig: StoreSettings['design_config']
}) {
  const { t } = useI18n()
  
  // Calculate dynamic shapes based on designConfig
  const catShape = designConfig.category_shape === 'square' ? 'rounded-none' : designConfig.category_shape === 'rounded' ? 'rounded-lg' : 'rounded-full'
  const imgRatioHeight = designConfig.product_image_ratio === 'portrait' ? 'h-24' : designConfig.product_image_ratio === 'landscape' ? 'h-12' : 'h-16'
  const logoHeight = designConfig.logo_size === 'small' ? 'h-6' : designConfig.logo_size === 'large' ? 'h-10' : 'h-8'

  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-100 bg-white"
      style={{ fontFamily: preview.font }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 transition-colors duration-500" style={{ backgroundColor: preview.secondary }}>
        <div className="flex items-center gap-3">
          {preview.logo ? (
            <img src={preview.logo} alt="" className={cn("w-auto object-cover rounded-md", logoHeight)} />
          ) : (
            <div className={cn("flex w-8 items-center justify-center rounded-lg text-xs font-bold text-white", logoHeight)} style={{ backgroundColor: preview.primary }}>
              {storeName.charAt(0)}
            </div>
          )}
          <span className="text-sm font-bold text-white">{storeName}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-300">
          <span>{t('common.shop') ?? 'Shop'}</span>
          <span>{t('common.cart') ?? 'Cart'}</span>
        </div>
      </div>

      {/* Banner */}
      {preview.showBanner && (
        <div
          className="relative flex items-center justify-center px-6 py-16 text-center overflow-hidden transition-all duration-500"
          style={{
            backgroundImage: preview.bannerUrl ? `url(${preview.bannerUrl})` : `linear-gradient(135deg, ${preview.primary}, ${preview.secondary} 150%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: preview.primary,
          }}
        >
          {!preview.bannerUrl && (
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
          )}
          <div className="relative z-10">
            <p className="text-2xl font-extrabold text-white">{preview.bannerHeading || (t('storefrontHome.welcomeTo', { store: storeName }) ?? 'Welcome!')}</p>
            {preview.bannerSubheading && (
              <p className="mt-3 text-sm text-white/90 max-w-md mx-auto">{preview.bannerSubheading}</p>
            )}
            <button
              className="mt-6 rounded-full bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              style={{ color: preview.primary }}
            >
              {t('customization.shopNow') ?? 'Shop Now'}
            </button>
          </div>
        </div>
      )}

      <div className="px-5 py-6">
        {/* Categories */}
        {preview.showCategories && (
          <div className="mb-8">
            <p className="mb-3 text-xs font-bold text-gray-800 uppercase tracking-wide">{t('common.categories') ?? 'Categories'}</p>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 6).map((cat) => (
                <span
                  key={cat.id}
                  className={cn("px-4 py-1.5 text-[11px] font-medium transition-colors", catShape)}
                  style={{ backgroundColor: `${preview.primary}15`, color: preview.primary }}
                >
                  {cat.name}
                </span>
              ))}
              {categories.length === 0 && (
                <span className="text-[11px] text-gray-400">{t('customization.addCategoriesInDashboard') ?? 'Add categories'}</span>
              )}
            </div>
          </div>
        )}

        {/* Products */}
        {preview.showFeatured && (
          <div>
            <p className="mb-3 text-xs font-bold text-gray-800 uppercase tracking-wide">{t('customization.featuredProducts') ?? 'Featured'}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.slice(0, 3).length > 0
                ? products.slice(0, 3).map((p, i) => (
                    <div key={p.id ?? `ph-${i}`} className="group rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm hover:shadow-md transition-all">
                      <div className={cn("mb-2.5 w-full rounded-lg bg-gray-100 transition-colors group-hover:bg-gray-200", imgRatioHeight)} />
                      <p className="truncate text-[11px] font-semibold text-gray-800">{p.name ?? t('customization.yourProduct')}</p>
                      <p className="mt-1 text-[11px] font-bold" style={{ color: preview.primary }}>
                        {p.price != null ? formatMoneyShort(p.price, currency) : '—'}
                      </p>
                    </div>
                  ))
                : Array.from({ length: 3 }).map((_, i) => (
                    <div key={`ph-${i}`} className="rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm">
                      <div className={cn("mb-2.5 w-full rounded-lg bg-gray-100", imgRatioHeight)} />
                      <p className="truncate text-[11px] font-semibold text-gray-800">{t('customization.yourProduct') ?? 'Product Name'}</p>
                      <p className="mt-1 text-[11px] font-bold" style={{ color: preview.primary }}>
                        —
                      </p>
                    </div>
                  ))}
            </div>
            {products.length === 0 && (
              <p className="mt-2 text-[11px] text-gray-400">
                {t('customization.addActiveProducts') ?? 'Add products'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 text-center text-[11px] font-medium text-white/80 transition-colors duration-500" style={{ backgroundColor: preview.secondary }}>
        {preview.footerText || `© ${new Date().getFullYear()} ${storeName}`}
      </div>

      <div className="bg-gray-50 px-3 py-2 text-center text-[10px] font-mono text-gray-400 border-t border-gray-100">
        /store/{storeSlug}
      </div>
    </div>
  )
}

function formatMoneyShort(amount: number, currency: string) {
  return `${currency === 'USD' ? '$' : currency} ${amount.toFixed(2)}`
}
