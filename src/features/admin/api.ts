import { supabase } from '@/lib/supabase'

export interface PlatformStats {
  total_users: number
  total_stores: number
  active_stores: number
  suspended_stores: number
  total_products: number
  total_orders: number
  total_revenue: number
  new_users_30d: number
  new_stores_30d: number
  month_revenue: number
}

export interface PlatformStore {
  id: string
  name: string
  slug: string
  status: string
  currency: string
  created_at: string
  owner_name: string | null
  owner_email: string | null
  product_count: number
  order_count: number
  customer_count: number
  revenue: number
}

export interface PlatformUser {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  role: 'user' | 'platform_admin'
  store_count: number
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data, error } = await supabase.rpc('get_platform_stats')
  if (error) throw error
  return data as PlatformStats
}

export async function fetchPlatformStores(): Promise<PlatformStore[]> {
  const { data, error } = await supabase.rpc('get_platform_stores')
  if (error) throw error
  return (data as PlatformStore[]) ?? []
}

export async function fetchPlatformUsers(): Promise<PlatformUser[]> {
  const { data, error } = await supabase.rpc('get_platform_users')
  if (error) throw error
  return (data as PlatformUser[]) ?? []
}

export async function setStoreStatus(storeId: string, status: 'active' | 'suspended') {
  const { error } = await supabase.rpc('set_store_status', { p_store_id: storeId, p_status: status })
  if (error) throw error
}

export async function setUserRole(userId: string, role: 'user' | 'platform_admin') {
  const { error } = await supabase.rpc('set_user_platform_role', { p_user_id: userId, p_role: role })
  if (error) throw error
}
