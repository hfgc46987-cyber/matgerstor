import { useQuery } from '@tanstack/react-query'
import {
  fetchCategories,
  fetchCustomers,
  fetchInventory,
  fetchOrder,
  fetchOrders,
  fetchPlans,
  fetchProduct,
  fetchProducts,
  fetchSalesSeries,
  fetchSettings,
  fetchShippingMethods,
} from '@/lib/api'

export const storeKeys = {
  all: (storeId: string) => [storeId] as const,
  products: (storeId: string) => [...storeKeys.all(storeId), 'products'] as const,
  product: (storeId: string, id: string) => [...storeKeys.products(storeId), id] as const,
  categories: (storeId: string) => [...storeKeys.all(storeId), 'categories'] as const,
  orders: (storeId: string) => [...storeKeys.all(storeId), 'orders'] as const,
  order: (storeId: string, id: string) => [...storeKeys.orders(storeId), id] as const,
  customers: (storeId: string) => [...storeKeys.all(storeId), 'customers'] as const,
  inventory: (storeId: string) => [...storeKeys.all(storeId), 'inventory'] as const,
  analytics: (storeId: string, range: string) => [...storeKeys.all(storeId), 'analytics', range] as const,
  settings: (storeId: string) => [...storeKeys.all(storeId), 'settings'] as const,
  shipping: (storeId: string) => [...storeKeys.all(storeId), 'shipping'] as const,
  plans: () => ['plans'] as const,
}

export function useProductsQuery(storeId: string, params: { page?: number; pageSize?: number; search?: string; status?: string; categoryId?: string }) {
  return useQuery({
    queryKey: [...storeKeys.products(storeId), params],
    queryFn: () => fetchProducts({ storeId, ...params }),
    enabled: Boolean(storeId),
  })
}

export function useProductQuery(storeId: string, productId: string | undefined) {
  return useQuery({
    queryKey: storeKeys.product(storeId, productId ?? ''),
    queryFn: () => fetchProduct(storeId, productId!),
    enabled: Boolean(storeId && productId),
  })
}

export function useCategoriesQuery(storeId: string) {
  return useQuery({
    queryKey: storeKeys.categories(storeId),
    queryFn: () => fetchCategories(storeId),
    enabled: Boolean(storeId),
  })
}

export function useOrdersQuery(storeId: string, params: { page?: number; pageSize?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: [...storeKeys.orders(storeId), params],
    queryFn: () => fetchOrders({ storeId, ...params }),
    enabled: Boolean(storeId),
  })
}

export function useOrderQuery(storeId: string, orderId: string | undefined) {
  return useQuery({
    queryKey: storeKeys.order(storeId, orderId ?? ''),
    queryFn: () => fetchOrder(storeId, orderId!),
    enabled: Boolean(storeId && orderId),
  })
}

export function useCustomersQuery(storeId: string, params: { page?: number; pageSize?: number; search?: string }) {
  return useQuery({
    queryKey: [...storeKeys.customers(storeId), params],
    queryFn: () => fetchCustomers({ storeId, ...params }),
    enabled: Boolean(storeId),
  })
}

export function useInventoryQuery(storeId: string, search?: string) {
  return useQuery({
    queryKey: [...storeKeys.inventory(storeId), search],
    queryFn: () => fetchInventory(storeId, search),
    enabled: Boolean(storeId),
  })
}

export function useAnalyticsQuery(storeId: string, range: 'today' | '7d' | '30d' | '12m') {
  return useQuery({
    queryKey: storeKeys.analytics(storeId, range),
    queryFn: () => fetchSalesSeries(storeId, range),
    enabled: Boolean(storeId),
  })
}

export function useSettingsQuery(storeId: string) {
  return useQuery({
    queryKey: storeKeys.settings(storeId),
    queryFn: () => fetchSettings(storeId),
    enabled: Boolean(storeId),
  })
}

export function useShippingMethodsQuery(storeId: string) {
  return useQuery({
    queryKey: storeKeys.shipping(storeId),
    queryFn: () => fetchShippingMethods(storeId),
    enabled: Boolean(storeId),
  })
}

export function usePlansQuery() {
  return useQuery({
    queryKey: storeKeys.plans(),
    queryFn: fetchPlans,
  })
}
