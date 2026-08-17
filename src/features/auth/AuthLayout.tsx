import { Link, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Store } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { LangSwitcher } from '@/components/ui/lang-switcher'

export default function AuthLayout() {
  const { user } = useAuth()
  const { t } = useI18n()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gray-900 p-12 lg:flex">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, #4f46e5 0, transparent 40%), radial-gradient(circle at 80% 70%, #0ea5e9 0, transparent 40%)',
        }} />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="StoreHub Logo" className="h-10 w-auto object-contain brightness-0 invert" />
            <span className="text-xl font-bold text-white">{t('app.name')}</span>
          </Link>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-white">
            {t('auth.heroTitle')}
          </h2>
          <p className="mt-4 text-gray-400">
            {t('auth.heroText')}
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-gray-400">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300">1</span>
            <span>{t('auth.step1')}</span>
            <span className="h-px w-6 bg-gray-700" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300">2</span>
            <span>{t('auth.step2')}</span>
            <span className="h-px w-6 bg-gray-700" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300">3</span>
            <span>{t('auth.step3')}</span>
          </div>
        </div>
        <p className="relative text-xs text-gray-500">
          © {new Date().getFullYear()} {t('app.name')}. {t('auth.builtOn')}
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="mb-8 flex w-full max-w-md items-center justify-between">
          <div className="flex items-center gap-2.5 lg:hidden">
            <img src="/logo.png" alt="StoreHub Logo" className="h-9 w-auto object-contain" />
            <span className="text-lg font-bold text-gray-900">{t('app.name')}</span>
          </div>
          <div className="ms-auto">
            <LangSwitcher />
          </div>
        </div>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
