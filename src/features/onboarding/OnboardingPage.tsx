import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, ArrowRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ImageUpload } from '@/components/ui/image-upload'
import { slugify } from '@/lib/utils'
import { PUBLIC_STORAGE_BASE } from '@/lib/supabase'
import { LangSwitcher } from '@/components/ui/lang-switcher'

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'AED', 'SAR', 'EGP', 'INR', 'JPY', 'AUD', 'CAD',
]
const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'United Arab Emirates',
  'Saudi Arabia', 'Egypt', 'India', 'Japan', 'Australia', 'Canada', 'Other',
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const { t } = useI18n()
  const { refreshStores } = useStore()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [country, setCountry] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const checkSlug = async (value: string) => {
    if (!value) {
      setSlugAvailable(null)
      return
    }
    setCheckingSlug(true)
    const { data } = await supabase.from('stores').select('id').eq('slug', value).maybeSingle()
    setSlugAvailable(!data)
    setCheckingSlug(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
      error(t('onboarding.invalidStoreLink'), t('onboarding.invalidStoreLinkMsg'))
      return
    }
    if (slugAvailable === false) {
      error(t('onboarding.linkTaken'), t('onboarding.linkTakenMsg'))
      return
    }
    setLoading(true)

    let uploadedLogo: string | null = null
    if (logoFile && logoUrl) {
      const path = `stores/tmp/${crypto.randomUUID()}-logo`
      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(path, logoFile)
      if (!uploadError) {
        uploadedLogo = `${PUBLIC_STORAGE_BASE}/store-assets/${path}`
      }
    }

    const { data, error: createError } = await supabase.rpc('create_store', {
      p_name: name.trim(),
      p_slug: slug,
      p_description: description.trim() || null,
      p_logo_url: uploadedLogo,
      p_currency: currency,
      p_country: country || null,
    })

    setLoading(false)

    if (createError) {
      if (createError.message.includes('duplicate')) {
        error(t('onboarding.linkTaken'), t('onboarding.linkTakenMsg'))
      } else {
        error(t('onboarding.couldNotCreateStore'), createError.message)
      }
      return
    }

    if (data?.id && uploadedLogo) {
      await supabase.storage
        .from('store-assets')
        .move(`stores/tmp/${uploadedLogo.split('/').pop()}`, `stores/${data.id}/branding/logo`)
    }

    await refreshStores()

    success(t('onboarding.storeCreated'), t('onboarding.storeCreatedMsg', { name: name.trim() }))
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="flex flex-col items-center text-center">
          <img src="/logo.png" alt="StoreHub Logo" className="h-12 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('onboarding.title')}</h1>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            {t('onboarding.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="space-y-5">
            <div>
              <Label htmlFor="storeName">{t('onboarding.storeName')}</Label>
              <Input
                id="storeName"
                required
                placeholder={t('onboarding.storeNamePlaceholder')}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="storeSlug">{t('onboarding.storeLink')}</Label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/30">
                <Globe className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="shrink-0 text-sm text-gray-400">storehub.com/store/</span>
                <input
                  id="storeSlug"
                  required
                  className="h-10 w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  placeholder="acme-boutique"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    setSlug(v)
                    checkSlug(v)
                  }}
                />
                {checkingSlug && <span className="text-xs text-gray-400">{t('onboarding.checking')}</span>}
                {slugAvailable === false && (
                  <span className="text-xs font-medium text-red-500">{t('onboarding.taken')}</span>
                )}
                {slugAvailable === true && (
                  <span className="text-xs font-medium text-emerald-500">{t('onboarding.available')}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {t('onboarding.urlHint')}
              </p>
            </div>

            <div>
              <Label htmlFor="storeDescription">{t('common.description')}</Label>
              <Textarea
                id="storeDescription"
                rows={3}
                placeholder={t('onboarding.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <Label>{t('settings.storeLogo')}</Label>
              <ImageUpload
                value={logoUrl}
                onChange={(url, file) => {
                  setLogoFile(file ?? null)
                  setLogoUrl(url)
                }}
                onClear={() => {
                  setLogoFile(null)
                  setLogoUrl(null)
                }}
                label={t('settings.storeLogo')}
                hint={t('onboarding.logoHint')}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="currency">{t('common.currency')}</Label>
                <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="country">{t('common.country')}</Label>
                <Select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">{t('onboarding.selectCountry')}</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t('onboarding.freePlanNoCard')}
            </div>
            <Button type="submit" size="lg" loading={loading}>
              {t('onboarding.createStore')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </form>

        <div className="mt-6 flex justify-center">
          <LangSwitcher />
        </div>
      </div>
    </div>
  )
}
