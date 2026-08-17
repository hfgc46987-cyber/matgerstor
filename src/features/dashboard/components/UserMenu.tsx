import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, Store, ExternalLink } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { useI18n } from '@/lib/i18n'
import { Avatar } from '@/components/ui/avatar'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/dropdown'

export default function UserMenu() {
  const { user, profile, signOut } = useAuth()
  const { currentStore } = useStore()
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-gray-100">
          <Avatar name={profile?.full_name} url={profile?.avatar_url} size="sm" />
          <div className="hidden text-start md:block">
            <p className="max-w-[10rem] truncate text-sm font-medium text-gray-900">
              {profile?.full_name ?? user?.email?.split('@')[0]}
            </p>
            <p className="max-w-[10rem] truncate text-xs text-gray-400">{user?.email}</p>
          </div>
        </button>
      }
    >
      {(close) => (
        <>
          <div className="border-b border-gray-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-gray-900">
              {profile?.full_name ?? t('userMenu.storehubUser')}
            </p>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
          <div className="py-1">
            {currentStore && (
              <DropdownItem
                onClick={() => {
                  close()
                  window.open(`/store/${currentStore.slug}`, '_blank')
                }}
              >
                <ExternalLink className="h-4 w-4" />
                {t('userMenu.viewStorefront')}
              </DropdownItem>
            )}
            <DropdownItem onClick={() => { close(); navigate('/onboarding') }}>
              <Store className="h-4 w-4" />
              {t('userMenu.createNewStore')}
            </DropdownItem>
            <DropdownItem onClick={() => { close(); navigate('/dashboard/settings') }}>
              <Settings className="h-4 w-4" />
              {t('userMenu.storeSettings')}
            </DropdownItem>
          </div>
          <DropdownDivider />
          <div className="py-1">
            <DropdownItem danger onClick={() => { close(); signOut() }}>
              <LogOut className="h-4 w-4" />
              {t('userMenu.signOut')}
            </DropdownItem>
          </div>
        </>
      )}
    </Dropdown>
  )
}
