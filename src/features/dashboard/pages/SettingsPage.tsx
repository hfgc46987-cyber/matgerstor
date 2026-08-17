import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Save, Plus, Trash2, CreditCard, Truck, Store as StoreIcon, Lock } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useSettingsQuery, useShippingMethodsQuery, storeKeys } from '@/lib/queries'
import { updateSettings, upsertShippingMethod, deleteShippingMethod } from '@/lib/api'
import { supabase, PUBLIC_STORAGE_BASE } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ImageUpload } from '@/components/ui/image-upload'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'EGP', 'INR', 'JPY', 'AUD', 'CAD']
const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'United Arab Emirates',
  'Saudi Arabia', 'Egypt', 'India', 'Japan', 'Australia', 'Canada', 'Other',
]

export default function SettingsPage() {
  const { currentStore, refreshStores } = useStore()
  const storeId = currentStore?.id ?? ''
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const { t } = useI18n()

  const { data: settingsData, isLoading: settingsLoading } = useSettingsQuery(storeId)
  const { data: shippingMethods, isLoading: shippingLoading } = useShippingMethodsQuery(storeId)

  const [storeForm, setStoreForm] = useState({
    name: currentStore?.name ?? '',
    slug: currentStore?.slug ?? '',
    description: currentStore?.description ?? '',
    currency: currentStore?.currency ?? 'USD',
    country: currentStore?.country ?? '',
    phone: currentStore?.phone ?? '',
    email: currentStore?.email ?? '',
    address: currentStore?.address ?? '',
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(currentStore?.logo_url ?? null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [savingStore, setSavingStore] = useState(false)

  const [freeShipping, setFreeShipping] = useState(settingsData?.free_shipping ?? false)
  const [freeShippingMin, setFreeShippingMin] = useState(settingsData?.free_shipping_min?.toString() ?? '')

  const [methodModal, setMethodModal] = useState(false)
  const [methodName, setMethodName] = useState('')
  const [methodPrice, setMethodPrice] = useState('')
  const [methodThreshold, setMethodThreshold] = useState('')
  const [deleteMethod, setDeleteMethod] = useState<string | null>(null)
  const [deletingMethod, setDeletingMethod] = useState(false)

  const handleStoreSave = async () => {
    setSavingStore(true)
    try {
      let logo = logoUrl
      if (logoFile) {
        const path = `stores/${storeId}/branding/logo`
        await supabase.storage.from('store-assets').remove([path])
        const { error: upErr } = await supabase.storage.from('store-assets').upload(path, logoFile, { upsert: true })
        if (upErr) throw upErr
        logo = `${PUBLIC_STORAGE_BASE}/store-assets/${path}`
      }
      const { error: updateErr } = await supabase
        .from('stores')
        .update({
          name: storeForm.name,
          slug: storeForm.slug,
          description: storeForm.description || null,
          currency: storeForm.currency,
          country: storeForm.country || null,
          phone: storeForm.phone || null,
          email: storeForm.email || null,
          address: storeForm.address || null,
          logo_url: logo,
        })
        .eq('id', storeId)
      if (updateErr) throw updateErr

      await updateSettings(storeId, {
        free_shipping: freeShipping,
        free_shipping_min: freeShipping && freeShippingMin ? Number(freeShippingMin) : null,
      })

      success(t('settings.settingsSaved'), t('settings.settingsSavedMsg'))
      queryClient.invalidateQueries({ queryKey: storeKeys.settings(storeId) })
      await refreshStores()
    } catch (e) {
      error(t('settings.couldNotSaveSettings'), (e as Error).message)
    } finally {
      setSavingStore(false)
    }
  }

  const saveShippingMethod = async () => {
    if (!methodName.trim()) {
      error(t('settings.methodNameRequired'))
      return
    }
    try {
      await upsertShippingMethod({
        storeId,
        name: methodName.trim(),
        price: Number(methodPrice) || 0,
        free_shipping_threshold: methodThreshold ? Number(methodThreshold) : null,
        is_active: true,
      })
      success(t('settings.shippingMethodAdded'))
      queryClient.invalidateQueries({ queryKey: storeKeys.shipping(storeId) })
      setMethodModal(false)
      setMethodName('')
      setMethodPrice('')
      setMethodThreshold('')
    } catch (e) {
      error(t('settings.couldNotAddShippingMethod'), (e as Error).message)
    }
  }

  const handleDeleteMethod = async () => {
    if (!deleteMethod) return
    setDeletingMethod(true)
    try {
      await deleteShippingMethod(deleteMethod)
      success(t('settings.shippingMethodRemoved'))
      queryClient.invalidateQueries({ queryKey: storeKeys.shipping(storeId) })
      setDeleteMethod(null)
    } catch (e) {
      error(t('settings.couldNotRemoveMethod'), (e as Error).message)
    } finally {
      setDeletingMethod(false)
    }
  }

  if (settingsLoading || shippingLoading) return <div className="flex justify-center py-24"><Spinner /></div>

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('settings.title')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{t('settings.subtitle')}</p>
      </div>

      {/* Store settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StoreIcon className="h-4 w-4" /> {t('settings.storeSettings')}
          </CardTitle>
          <CardDescription>{t('settings.storeSettingsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="sName">{t('settings.storeName')}</Label>
              <Input id="sName" value={storeForm.name} onChange={(e) => setStoreForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="sSlug">{t('settings.storeLink')}</Label>
              <Input id="sSlug" value={storeForm.slug} onChange={(e) => setStoreForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="sDesc">{t('common.description')}</Label>
            <Textarea id="sDesc" rows={3} value={storeForm.description} onChange={(e) => setStoreForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="sCurrency">{t('common.currency')}</Label>
              <Select id="sCurrency" value={storeForm.currency} onChange={(e) => setStoreForm((f) => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="sCountry">{t('common.country')}</Label>
              <Select id="sCountry" value={storeForm.country} onChange={(e) => setStoreForm((f) => ({ ...f, country: e.target.value }))}>
                <option value="">{t('settings.selectCountry')}</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="sPhone">{t('common.phone')}</Label>
              <Input id="sPhone" value={storeForm.phone} onChange={(e) => setStoreForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="sEmail">{t('common.email')}</Label>
              <Input id="sEmail" type="email" value={storeForm.email} onChange={(e) => setStoreForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="sAddress">{t('common.address')}</Label>
            <Textarea id="sAddress" rows={2} value={storeForm.address} onChange={(e) => setStoreForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <ImageUpload
            label={t('settings.storeLogo')}
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
          <div className="flex justify-end border-t border-gray-100 pt-5">
            <Button onClick={handleStoreSave} loading={savingStore}>
              <Save className="h-4 w-4" />
              {t('settings.saveStoreSettings')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shipping settings */}
      <Card>
        <CardHeader
          action={
            <Button size="sm" onClick={() => setMethodModal(true)}>
              <Plus className="h-4 w-4" />
              {t('settings.addMethod')}
            </Button>
          }
        >
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4" /> {t('settings.shippingSettings')}
          </CardTitle>
          <CardDescription>{t('settings.shippingSettingsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('settings.freeShipping')}</p>
              <p className="text-xs text-gray-500">{t('settings.freeShippingDesc')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={freeShipping}
              onClick={() => setFreeShipping((v) => !v)}
              className={cn('relative h-6 w-11 shrink-0 rounded-full transition', freeShipping ? 'bg-primary-600' : 'bg-gray-300')}
            >
              <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', freeShipping ? 'start-[22px]' : 'start-0.5')} />
            </button>
          </div>
          {freeShipping && (
            <div className="max-w-xs">
              <Label htmlFor="fsMin">{t('settings.freeShippingMinimum')}</Label>
              <Input
                id="fsMin"
                type="number"
                min="0"
                step="0.01"
                value={freeShippingMin}
                onChange={(e) => setFreeShippingMin(e.target.value)}
                placeholder="50.00"
              />
            </div>
          )}

          {(shippingMethods ?? []).length > 0 ? (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
              {(shippingMethods ?? []).map((method) => (
                <div key={method.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{method.name}</p>
                      <p className="text-xs text-gray-400">
                        {method.price === 0 ? t('common.free') : `$${method.price}`}
                        {method.free_shipping_threshold != null && ` · ${t('settings.freeOver', { amount: `$${method.free_shipping_threshold}` })}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteMethod(method.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {t('settings.noShippingMethods')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> {t('settings.paymentSettings')}
          </CardTitle>
          <CardDescription>{t('settings.paymentSettingsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Lock className="h-5 w-5 text-primary-600" />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">{t('settings.paymentsComingSoon')}</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
              {t('settings.paymentsComingSoonDesc')}
            </p>
            <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-gray-500">
              {['Stripe', 'PayPal', 'Adyen', 'Moyasar'].map((p) => (
                <span key={p} className="rounded-full border border-gray-200 bg-white px-3 py-1">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add shipping method modal */}
      <ConfirmAddMethod
        open={methodModal}
        onClose={() => setMethodModal(false)}
        name={methodName}
        price={methodPrice}
        threshold={methodThreshold}
        onNameChange={setMethodName}
        onPriceChange={setMethodPrice}
        onThresholdChange={setMethodThreshold}
        onSave={saveShippingMethod}
      />

      <ConfirmDialog
        open={Boolean(deleteMethod)}
        onClose={() => setDeleteMethod(null)}
        onConfirm={handleDeleteMethod}
        title={t('settings.removeShippingMethod')}
        description={t('settings.removeShippingMethodDesc')}
        confirmLabel={t('settings.remove')}
        danger
        loading={deletingMethod}
      />
    </div>
  )
}

function ConfirmAddMethod({
  open,
  onClose,
  name,
  price,
  threshold,
  onNameChange,
  onPriceChange,
  onThresholdChange,
  onSave,
}: {
  open: boolean
  onClose: () => void
  name: string
  price: string
  threshold: string
  onNameChange: (v: string) => void
  onPriceChange: (v: string) => void
  onThresholdChange: (v: string) => void
  onSave: () => void
}) {
  const { t } = useI18n()
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-slide-up">
        <h3 className="text-base font-semibold text-gray-900">{t('settings.addShippingMethod')}</h3>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="mName">{t('settings.methodName')}</Label>
            <Input id="mName" value={name} onChange={(e) => onNameChange(e.target.value)} placeholder={t('settings.methodNamePlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mPrice">{t('common.price')}</Label>
              <Input id="mPrice" type="number" min="0" step="0.01" value={price} onChange={(e) => onPriceChange(e.target.value)} placeholder="5.00" />
            </div>
            <div>
              <Label htmlFor="mThreshold">{t('settings.freeOverOptional')}</Label>
              <Input id="mThreshold" type="number" min="0" step="0.01" value={threshold} onChange={(e) => onThresholdChange(e.target.value)} placeholder="50.00" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={onSave}>{t('settings.addMethodButton')}</Button>
        </div>
      </div>
    </div>
  )
}
