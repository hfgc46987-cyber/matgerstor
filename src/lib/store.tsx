import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Notification, Store, StoreRole, StoreSettings } from '@/lib/types'

interface UserStore extends Store {
  role: StoreRole
}

interface StoreContextValue {
  stores: UserStore[]
  storesLoading: boolean
  currentStore: Store | null
  currentStoreRole: StoreRole | null
  settings: StoreSettings | null
  notifications: Notification[]
  unreadCount: number
  setCurrentStoreId: (id: string) => void
  refreshStores: () => Promise<void>
  refreshSettings: () => Promise<void>
  refreshNotifications: () => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined)

const SELECTED_STORE_KEY = 'storecraft:selected-store'

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [stores, setStores] = useState<UserStore[]>([])
  const [storesLoading, setStoresLoading] = useState(false)
  const [currentStoreId, setCurrentStoreIdState] = useState<string | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const currentStore = useMemo(
    () => stores.find((s) => s.id === currentStoreId) ?? stores[0] ?? null,
    [stores, currentStoreId],
  )

  const currentStoreRole = currentStore?.role ?? null

  const loadStores = useCallback(async () => {
    if (!user) {
      setStores([])
      return
    }
    setStoresLoading(true)
    const { data } = await supabase
      .from('store_members')
      .select('role, stores(*)')
      .eq('user_id', user.id)
      .order('created_at', { referencedTable: 'stores', ascending: true })

    const mapped: UserStore[] = (data ?? [])
      .map((row) => {
        const store = Array.isArray(row.stores) ? row.stores[0] : row.stores
        if (!store) return null
        return { ...(store as Store), role: row.role as StoreRole }
      })
      .filter((s): s is UserStore => s !== null)

    setStores(mapped)

    const stored = localStorage.getItem(`${SELECTED_STORE_KEY}:${user.id}`)
    if (stored && mapped.some((s) => s.id === stored)) {
      setCurrentStoreIdState(stored)
    } else if (mapped.length > 0) {
      setCurrentStoreIdState(mapped[0].id)
    } else {
      setCurrentStoreIdState(null)
    }
    setStoresLoading(false)
  }, [user])

  const loadSettings = useCallback(async (storeId: string) => {
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle()
    setSettings(data ?? null)
  }, [])

  const loadNotifications = useCallback(async (storeId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data ?? [])
  }, [])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  useEffect(() => {
    if (!currentStoreId) {
      setSettings(null)
      setNotifications([])
      return
    }
    loadSettings(currentStoreId)
    loadNotifications(currentStoreId)
  }, [currentStoreId, loadSettings, loadNotifications])

  const value = useMemo<StoreContextValue>(
    () => ({
      stores,
      storesLoading,
      currentStore,
      currentStoreRole,
      settings,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      setCurrentStoreId: (id: string) => {
        setCurrentStoreIdState(id)
        if (user) localStorage.setItem(`${SELECTED_STORE_KEY}:${user.id}`, id)
      },
      refreshStores: loadStores,
      refreshSettings: async () => {
        if (currentStoreId) await loadSettings(currentStoreId)
      },
      refreshNotifications: async () => {
        if (currentStoreId) await loadNotifications(currentStoreId)
      },
      markAllNotificationsRead: async () => {
        if (!currentStoreId) return
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('store_id', currentStoreId)
          .eq('read', false)
        await loadNotifications(currentStoreId)
      },
      deleteNotification: async (id: string) => {
        await supabase.from('notifications').delete().eq('id', id)
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      },
    }),
    [
      stores,
      storesLoading,
      currentStore,
      currentStoreRole,
      settings,
      notifications,
      currentStoreId,
      loadSettings,
      loadNotifications,
      loadStores,
      user,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
