import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import StoreSwitcher from './components/StoreSwitcher'
import NotificationsMenu from './components/NotificationsMenu'
import UserMenu from './components/UserMenu'
import { LangSwitcher } from '@/components/ui/lang-switcher'
import { useStore } from '@/lib/store'

export default function DashboardLayout() {
  const { currentStore } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-col lg:ps-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <StoreSwitcher />
          </div>
          <div className="flex items-center gap-2.5">
            <LangSwitcher />
            <NotificationsMenu />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-gray-200 px-6 py-4 text-center text-xs text-gray-400">
          {currentStore ? (
            <>
              <Link to="/" className="hover:text-gray-600">StoreCraft</Link>
              <span className="mx-1">·</span>
              <span>{currentStore.name}</span>
            </>
          ) : (
            'StoreCraft'
          )}
        </footer>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-y-0 start-0 z-30 lg:hidden">
          <Sidebar />
        </div>
      )}
    </div>
  )
}
