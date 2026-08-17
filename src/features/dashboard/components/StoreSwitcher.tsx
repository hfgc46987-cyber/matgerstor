import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronsUpDown, Store } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/dropdown'

export default function StoreSwitcher() {
  const { stores, currentStore, setCurrentStoreId } = useStore()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return stores
    return stores.filter((s) => s.name.toLowerCase().includes(q))
  }, [stores, query])

  if (!currentStore || stores.length === 0) return null

  return (
    <Dropdown
      className="w-72"
      trigger={
        <button className="flex h-10 max-w-xs items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition hover:bg-gray-50">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary-100 text-primary-600">
            {currentStore.logo_url ? (
              <img
                src={currentStore.logo_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Store className="h-3.5 w-3.5" />
            )}
          </div>
          <span className="max-w-[10rem] truncate font-medium text-gray-900">
            {currentStore.name}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      }
    >
      {(close) => (
        <>
          <div className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('storeSwitcher.yourStores')}
          </div>
          <div className="px-3.5 pb-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('storeSwitcher.searchPlaceholder')}
              className="h-8 w-full rounded-md border border-gray-200 px-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.map((store) => (
              <DropdownItem
                key={store.id}
                onClick={() => {
                  setCurrentStoreId(store.id)
                  close()
                  navigate('/dashboard')
                }}
                className={cn(
                  'justify-between',
                  store.id === currentStore.id && 'bg-primary-50 text-primary-700',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-500">
                    {store.logo_url ? (
                      <img src={store.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="truncate font-medium">{store.name}</span>
                </span>
                {store.id === currentStore.id && <Check className="h-4 w-4" />}
              </DropdownItem>
            ))}
            {filtered.length === 0 && (
              <p className="px-3.5 py-3 text-center text-xs text-gray-400">{t('storeSwitcher.noStoresFound')}</p>
            )}
          </div>
          <DropdownDivider />
          <DropdownItem
            onClick={() => {
              close()
              navigate('/onboarding')
            }}
          >
              <span className="flex items-center gap-2.5 font-medium text-primary-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-50">
                  <span className="text-base leading-none">+</span>
                </span>
                {t('storeSwitcher.createNewStore')}
              </span>
          </DropdownItem>
        </>
      )}
    </Dropdown>
  )
}
