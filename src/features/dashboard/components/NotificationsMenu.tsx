import { useNavigate } from 'react-router-dom'
import { Bell, Package, ShoppingBag, Info, Store } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useI18n } from '@/lib/i18n'
import { Dropdown, DropdownDivider, DropdownItem } from '@/components/ui/dropdown'
import { timeAgo, cn } from '@/lib/utils'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  order: <ShoppingBag className="h-4 w-4 text-blue-500" />,
  product: <Package className="h-4 w-4 text-violet-500" />,
  store: <Store className="h-4 w-4 text-emerald-500" />,
  info: <Info className="h-4 w-4 text-gray-400" />,
}

export default function NotificationsMenu() {
  const { notifications, unreadCount, markAllNotificationsRead, refreshNotifications, deleteNotification } = useStore()
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <Dropdown
      className="w-80"
      trigger={
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50">
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? t('notifications.unreadOverflow') : unreadCount}
            </span>
          )}
        </button>
      }
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm font-semibold text-gray-900">{t('notifications.title')}</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsRead()}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
          <DropdownDivider />
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-400">{t('notifications.noNotifications')}</p>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  close()
                  if (n.type === 'order') navigate('/dashboard/orders')
                  else if (n.type === 'product') navigate('/dashboard/products')
                }}
                className={cn(
                  'flex cursor-pointer gap-3 border-b border-gray-50 px-4 py-3 transition hover:bg-gray-50',
                  !n.read && 'bg-primary-50/40',
                )}
              >
                <div className="mt-0.5 shrink-0">{TYPE_ICONS[n.type] ?? TYPE_ICONS.info}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  {n.message && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.message}</p>}
                  <p className="mt-1 text-[11px] text-gray-400">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
              </div>
            ))}
          </div>
          {notifications.length > 0 && (
            <>
              <DropdownDivider />
              <DropdownItem
                onClick={() => {
                  close()
                  refreshNotifications()
                }}
              >
                {t('notifications.refresh')}
              </DropdownItem>
              <DropdownItem
                danger
                onClick={() => {
                  notifications.forEach((n) => deleteNotification(n.id))
                }}
              >
                {t('notifications.clearAll')}
              </DropdownItem>
            </>
          )}
        </>
      )}
    </Dropdown>
  )
}
