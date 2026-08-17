import { Link } from 'react-router-dom'
import {
  Store,
  Package,
  ShoppingCart,
  BarChart3,
  Palette,
  ShieldCheck,
  LayoutDashboard,
  Zap,
  ArrowRight,
  Check,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useI18n, type MessageKey } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { LangSwitcher } from '@/components/ui/lang-switcher'

const FEATURES: { icon: typeof Store; titleKey: MessageKey; descKey: MessageKey }[] = [
  { icon: Store, titleKey: 'landing.featureStorefrontTitle', descKey: 'landing.featureStorefrontDesc' },
  { icon: Package, titleKey: 'landing.featureProductsTitle', descKey: 'landing.featureProductsDesc' },
  { icon: ShoppingCart, titleKey: 'landing.featureOrdersTitle', descKey: 'landing.featureOrdersDesc' },
  { icon: BarChart3, titleKey: 'landing.featureAnalyticsTitle', descKey: 'landing.featureAnalyticsDesc' },
  { icon: Palette, titleKey: 'landing.featureCustomizeTitle', descKey: 'landing.featureCustomizeDesc' },
  { icon: ShieldCheck, titleKey: 'landing.featureSecurityTitle', descKey: 'landing.featureSecurityDesc' },
]

const STEPS: { titleKey: MessageKey; descKey: MessageKey }[] = [
  { titleKey: 'landing.step1Title', descKey: 'landing.step1Desc' },
  { titleKey: 'landing.step2Title', descKey: 'landing.step2Desc' },
  { titleKey: 'landing.step3Title', descKey: 'landing.step3Desc' },
  { titleKey: 'landing.step4Title', descKey: 'landing.step4Desc' },
]

const PLANS: {
  nameKey: MessageKey
  price: string
  period: string
  featureKeys: MessageKey[]
  highlight: boolean
}[] = [
  {
    nameKey: 'landing.planFreeName',
    price: '$0',
    period: 'landing.planFreePeriod',
    featureKeys: ['landing.planFreeF1', 'landing.planFreeF2', 'landing.planFreeF3', 'landing.planFreeF4', 'landing.planFreeF5'],
    highlight: false,
  },
  {
    nameKey: 'landing.planBasicName',
    price: '$19',
    period: '/month',
    featureKeys: ['landing.planBasicF1', 'landing.planBasicF2', 'landing.planBasicF3', 'landing.planBasicF4'],
    highlight: true,
  },
  {
    nameKey: 'landing.planProName',
    price: '$49',
    period: '/month',
    featureKeys: ['landing.planProF1', 'landing.planProF2', 'landing.planProF3', 'landing.planProF4'],
    highlight: false,
  },
]

const HIGHLIGHT_SENTINEL = '\u0000'

export default function LandingPage() {
  const { user } = useAuth()
  const { t } = useI18n()

  const heroTitleParts = t('landing.heroTitle', { highlight: HIGHLIGHT_SENTINEL }).split(HIGHLIGHT_SENTINEL)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="StoreHub Logo" className="h-9 w-auto object-contain" />
            <span className="text-lg font-bold text-gray-900">{t('app.name')}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="hover:text-gray-900">{t('landing.navFeatures')}</a>
            <a href="#how" className="hover:text-gray-900">{t('landing.navHow')}</a>
            <a href="#pricing" className="hover:text-gray-900">{t('landing.navPricing')}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            {user ? (
              <Link to="/dashboard">
                <Button>
                  {t('landing.goToDashboard')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block">
                  {t('landing.signIn')}
                </Link>
                <Link to="/signup">
                  <Button>{t('landing.getStarted')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #4f46e5 0, transparent 40%), radial-gradient(circle at 80% 70%, #0ea5e9 0, transparent 35%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
            <Zap className="h-3.5 w-3.5" />
            {t('landing.multiTenantBadge')}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            {heroTitleParts[0]}
            <span className="bg-gradient-to-r from-primary-600 to-blue-500 bg-clip-text text-transparent">
              {t('landing.minutes')}
            </span>
            {heroTitleParts[1]}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-500">
            {t('landing.heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={user ? '/dashboard' : '/signup'}>
              <Button size="lg">
                {t('landing.startFree')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
            <Link to={user ? '/dashboard' : '/login'}>
              <Button size="lg" variant="outline">
                <LayoutDashboard className="h-4 w-4" />
                {user ? t('landing.viewDashboard') : t('landing.signIn')}
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">{t('landing.freeForever')}</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">{t('landing.everythingNeed')}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              {t('landing.completeToolkit')}
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.titleKey} className="rounded-2xl border border-gray-100 bg-white p-6 transition hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">{t(feature.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">{t('landing.howItWorksTitle')}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              {t('landing.howItWorksSubtitle')}
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, idx) => (
              <div key={step.titleKey} className="relative rounded-2xl border border-gray-100 p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                  {idx + 1}
                </span>
                <h3 className="mt-4 text-base font-bold text-gray-900">{t(step.titleKey)}</h3>
                <p className="mt-2 text-sm text-gray-500">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">{t('landing.pricingTitle')}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              {t('landing.pricingSubtitle')}
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.nameKey}
                className={
                  plan.highlight
                    ? 'relative rounded-2xl border-2 border-primary-600 bg-white p-6 shadow-lg'
                    : 'rounded-2xl border border-gray-100 bg-white p-6'
                }
              >
                {plan.highlight && (
                  <span className="absolute -top-3 start-6 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white">
                    {t('landing.popular')}
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{t(plan.nameKey)}</h3>
                <p className="mt-2 text-3xl font-extrabold text-gray-900">
                  {plan.price}
                  <span className="text-sm font-medium text-gray-400">{plan.period === 'landing.planFreePeriod' ? t('landing.planFreePeriod') : plan.period}</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {plan.featureKeys.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {t(f)}
                    </li>
                  ))}
                </ul>
                <Link to={user ? '/dashboard' : '/signup'} className="mt-6 block">
                  <Button variant={plan.highlight ? 'primary' : 'outline'} className="w-full">
                    {t('landing.getStarted')}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">{t('landing.readyToStart')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-400">
            {t('landing.joinStorecraft')}
          </p>
          <Link to={user ? '/dashboard' : '/signup'} className="mt-8 inline-block">
            <Button size="lg">
              {t('landing.createYourStore')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-gray-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="StoreHub Logo" className="h-5 w-auto object-contain grayscale" />
            <span className="font-semibold text-gray-600">{t('app.name')}</span>
          </div>
          <p>© {new Date().getFullYear()} {t('app.name')}. {t('auth.builtOn')}</p>
        </div>
      </footer>
    </div>
  )
}
