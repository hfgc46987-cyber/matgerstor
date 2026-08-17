import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  Boxes,
  BarChart3,
  Palette,
  Settings,
  Store,
  ExternalLink,
  ShieldCheck,
  Megaphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useI18n, type MessageKey } from '@/lib/i18n'

export default function Sidebar() {
  const { currentStore } = useStore()
  const { t } = useI18n()

  const NAV_ITEMS: { to: string; label: MessageKey; icon: typeof LayoutDashboard; end?: boolean }[] = [
    { to: '/dashboard', label: 'nav.overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/orders', label: 'nav.orders', icon: ShoppingCart },
    { to: '/dashboard/products', label: 'nav.products', icon: Package },
    { to: '/dashboard/categories', label: 'nav.categories', icon: Tags },
    { to: '/dashboard/customers', label: 'nav.customers', icon: Users },
    { to: '/dashboard/inventory', label: 'nav.inventory', icon: Boxes },
    { to: '/dashboard/marketing', label: 'nav.marketing', icon: Megaphone },
    { to: '/dashboard/analytics', label: 'nav.analytics', icon: BarChart3 },
    { to: '/dashboard/customization', label: 'nav.storeCustomization', icon: Palette },
    { to: '/dashboard/settings', label: 'nav.settings', icon: Settings },
  ]

  return (
    <aside className="fixed inset-y-0 start-0 z-30 flex w-64 flex-col border-e border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-5">
          <img src="/logo.png" alt="StoreHub Logo" className="h-8 w-auto object-contain" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">{t('app.name')}</p>
          <p className="text-[11px] text-gray-400">{t('sidebar.storeManager')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {t(item.label)}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-gray-100 px-3 py-3">
        {currentStore && (
          <a
            href={`/store/${currentStore.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <ExternalLink className="h-[18px] w-[18px]" />
            {t('sidebar.viewStorefront')}
          </a>
        )}
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900',
              isActive && 'bg-primary-50 text-primary-700',
            )
          }
        >
          <ShieldCheck className="h-[18px] w-[18px]" />
          {t('sidebar.platformAdmin')}
        </NavLink>
      </div>
    </aside>
  )
}

export function StoreLogo({ size = 36 }: { size?: number }) {
  const { currentStore } = useStore()
  if (!currentStore) return null
  if (currentStore.logo_url) {
    return (
      <img
        src={currentStore.logo_url}
        alt={currentStore.name}
        style={{ width: size, height: size }}
        className="rounded-lg object-cover"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-lg bg-primary-600 text-white"
    >
      <Store className="h-1/2 w-1/2" />
    </div>
  )
}
