import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, Users, Store, CreditCard, ShieldCheck, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { useI18n, type MessageKey } from '@/lib/i18n'
import { LangSwitcher } from '@/components/ui/lang-switcher'

const NAV: { to: string; label: MessageKey; icon: typeof LayoutDashboard; end?: boolean }[] = [
  { to: '/admin', label: 'admin.navOverview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'admin.navUsers', icon: Users },
  { to: '/admin/stores', label: 'admin.navStores', icon: Store },
  { to: '/admin/plans', label: 'admin.navPlans', icon: CreditCard },
]

export default function AdminLayout() {
  const { profile } = useAuth()
  const { t } = useI18n()

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 flex w-60 flex-col border-e border-gray-800 bg-gray-950">
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{t('app.name')}</p>
            <p className="text-[11px] text-gray-500">{t('admin.platformAdmin')}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-violet-600/20 text-violet-300'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-800 px-3 py-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-gray-900 hover:text-white"
          >
            <ArrowLeft className="h-[18px] w-[18px] rtl:rotate-180" />
            {t('admin.backToDashboard')}
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen w-full flex-col lg:ps-60">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950/80 px-6 backdrop-blur-md">
          <div>
            <p className="text-sm font-semibold text-white">{t('admin.platformAdministration')}</p>
            <p className="text-xs text-gray-500">{t('admin.signedInAs', { name: profile?.full_name ?? 'Admin' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <span className="rounded-full bg-violet-600/20 px-3 py-1 text-xs font-semibold text-violet-300">
              {t('admin.platformAdmin')}
            </span>
          </div>
        </header>
        <main className="flex-1 bg-gray-100 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
