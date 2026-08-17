import { supabase } from '@/lib/supabase'
import {
  Category,
  Customer,
  Notification,
  Order,
  OrderItem,
  OrderWithItems,
  Product,
  ProductImage,
  ProductWithImages,
  StoreSettings,
  Subscription,
  Plan,
  OrderStatus,
  Coupon,
} from '@/lib/types'

// ---------- Products ----------

export async function fetchProducts(params: {
  storeId: string
  page?: number
  pageSize?: number
  search?: string
  status?: string
  categoryId?: string
}) {
  const { storeId, page = 1, pageSize = 12, search, status, categoryId } = params
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`)
  }
  if (status && status !== 'all') query = query.eq('status', status)
  if (categoryId) query = query.eq('category_id', categoryId)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, count, error } = await query
  if (error) throw error
  return { data: (data as Product[]) ?? [], count: count ?? 0 }
}

export async function fetchProduct(storeId: string, productId: string): Promise<ProductWithImages | null> {
  const { data: product, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', productId)
    .eq('store_id', storeId)
    .maybeSingle()
  if (error) throw error
  if (!product) return null

  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('position', { ascending: true })

  return { ...(product as Product), category: product.category, images: (images as ProductImage[]) ?? [] }
}

export interface UpsertProductInput {
  id?: string
  storeId: string
  name: string
  slug: string
  description?: string
  price: number
  compare_price?: number | null
  cost_price?: number | null
  sku?: string | null
  barcode?: string | null
  stock_quantity: number
  track_inventory: boolean
  status: 'active' | 'draft' | 'archived'
  featured: boolean
  category_id?: string | null
}

export async function upsertProduct(input: UpsertProductInput): Promise<Product> {
  const payload = {
    id: input.id,
    store_id: input.storeId,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    price: input.price,
    compare_price: input.compare_price ?? null,
    cost_price: input.cost_price ?? null,
    sku: input.sku || null,
    barcode: input.barcode || null,
    stock_quantity: input.stock_quantity,
    track_inventory: input.track_inventory,
    status: input.status,
    featured: input.featured,
    category_id: input.category_id ?? null,
  }
  if (input.id) {
    delete (payload as { id?: string }).id
    const { data, error } = await supabase.from('products').update(payload).eq('id', input.id).select().single()
    if (error) throw error
    return data as Product
  }
  const { data, error } = await supabase.from('products').insert(payload).select().single()
  if (error) throw error
  return data as Product
}

export async function deleteProduct(product: Product) {
  const { data: images } = await supabase
    .from('product_images')
    .select('url')
    .eq('product_id', product.id)
  if (images) {
    const paths = images
      .map((img) => {
        const match = img.url.match(/\/product-images\/(.+)$/)
        return match ? decodeURIComponent(match[1]) : null
      })
      .filter(Boolean) as string[]
    if (paths.length > 0) {
      await supabase.storage.from('product-images').remove(paths)
    }
  }
  const { error } = await supabase.from('products').delete().eq('id', product.id)
  if (error) throw error
}

// ---------- Product images ----------

export async function setProductImages(storeId: string, productId: string, images: ProductImage[]) {
  const { data: existing } = await supabase.from('product_images').select('url').eq('product_id', productId)
  const kept = new Set(images.map((i) => i.url))
  const removed = (existing ?? [])
    .map((img) => {
      const match = img.url.match(/\/product-images\/(.+)$/)
      return match && !kept.has(img.url) ? decodeURIComponent(match[1]) : null
    })
    .filter(Boolean) as string[]
  if (removed.length > 0) {
    await supabase.storage.from('product-images').remove(removed)
  }
  await supabase.from('product_images').delete().eq('product_id', productId)

  if (images.length > 0) {
    const rows = images.map((img, idx) => ({
      product_id: productId,
      store_id: storeId,
      url: img.url,
      position: idx,
      is_primary: idx === 0,
    }))
    const { error } = await supabase.from('product_images').insert(rows)
    if (error) throw error
  }
}

// ---------- Categories ----------

export async function fetchCategories(storeId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as Category[]) ?? []
}

export async function upsertCategory(input: {
  id?: string
  storeId: string
  name: string
  slug: string
  description?: string
  image_url?: string | null
  parent_id?: string | null
}): Promise<Category> {
  const payload = {
    id: input.id,
    store_id: input.storeId,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    image_url: input.image_url ?? null,
    parent_id: input.parent_id ?? null,
  }
  if (input.id) {
    delete (payload as { id?: string }).id
    const { data, error } = await supabase.from('categories').update(payload).eq('id', input.id).select().single()
    if (error) throw error
    return data as Category
  }
  const { data, error } = await supabase.from('categories').insert(payload).select().single()
  if (error) throw error
  return data as Category
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ---------- Orders ----------

export async function fetchOrders(params: {
  storeId: string
  page?: number
  pageSize?: number
  status?: string
  search?: string
}) {
  const { storeId, page = 1, pageSize = 15, status, search } = params
  let query = supabase
    .from('orders')
    .select('*, customer:customers(id, name, email, phone)', { count: 'exact' })
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (search) {
    query = query.or(`order_number.ilike.%${search}%,customer.name.ilike.%${search}%`)
  }

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, count, error } = await query
  if (error) throw error
  return { data: (data as (Order & { customer: Customer | null })[]) ?? [], count: count ?? 0 }
}

export async function fetchOrder(storeId: string, orderId: string): Promise<OrderWithItems | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, customer:customers(*)')
    .eq('id', orderId)
    .eq('store_id', storeId)
    .maybeSingle()
  if (error) throw error
  if (!order) return null

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  return { ...(order as Order), items: (items as OrderItem[]) ?? [], customer: order.customer ?? null }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (error) throw error
}

export async function updatePaymentStatus(orderId: string, payment_status: 'unpaid' | 'paid' | 'refunded') {
  const { error } = await supabase.from('orders').update({ payment_status }).eq('id', orderId)
  if (error) throw error
}

// ---------- Customers ----------

export async function fetchCustomers(params: {
  storeId: string
  page?: number
  pageSize?: number
  search?: string
}) {
  const { storeId, page = 1, pageSize = 15, search } = params
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, count, error } = await query
  if (error) throw error
  return { data: (data as Customer[]) ?? [], count: count ?? 0 }
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

// ---------- Inventory ----------

export async function fetchInventory(storeId: string, search?: string) {
  let query = supabase
    .from('products')
    .select('id, name, sku, stock_quantity, track_inventory, status, price')
    .eq('store_id', storeId)
    .order('stock_quantity', { ascending: true })

  if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)

  const { data, error } = await query
  if (error) throw error
  return (data as Pick<Product, 'id' | 'name' | 'sku' | 'stock_quantity' | 'track_inventory' | 'status' | 'price'>[]) ?? []
}

export async function updateStock(productId: string, stock: number) {
  const { error } = await supabase
    .from('products')
    .update({ stock_quantity: stock })
    .eq('id', productId)
  if (error) throw error
}

// ---------- Analytics ----------

export type SalesRow = { date: string; revenue: number; orders: number }

export async function fetchSalesSeries(storeId: string, range: 'today' | '7d' | '30d' | '12m'): Promise<SalesRow[]> {
  const { data: products } = await supabase
    .from('orders')
    .select('created_at, total')
    .eq('store_id', storeId)
    .gte('created_at', rangeStart(range))
    .order('created_at', { ascending: true })
  if (!products) return []

  const bucket: Record<string, { revenue: number; orders: number }> = {}
  for (const row of products) {
    const key = bucketKey(row.created_at, range)
    if (!bucket[key]) bucket[key] = { revenue: 0, orders: 0 }
    bucket[key].revenue += Number(row.total)
    bucket[key].orders += 1
  }
  return fillSeries(range).map((key) => bucket[key] ?? { revenue: 0, orders: 0 }).map((b, i) => ({
    date: fillSeries(range)[i],
    revenue: Number(b.revenue.toFixed(2)),
    orders: b.orders,
  }))
}

function rangeStart(range: string): string {
  const now = new Date()
  if (range === 'today') now.setHours(0, 0, 0, 0)
  if (range === '7d') now.setDate(now.getDate() - 6)
  if (range === '30d') now.setDate(now.getDate() - 29)
  if (range === '12m') now.setMonth(now.getMonth() - 11)
  return now.toISOString()
}

function bucketKey(dateStr: string, range: string): string {
  const d = new Date(dateStr)
  if (range === 'today' || range === '7d') return d.toISOString().slice(0, 10)
  if (range === '30d') return d.toISOString().slice(0, 10)
  // 12m
  return d.toISOString().slice(0, 7)
}

function fillSeries(range: string): string[] {
  const keys: string[] = []
  const now = new Date()
  if (range === 'today') {
    keys.push(now.toISOString().slice(0, 10))
  } else if (range === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      keys.push(d.toISOString().slice(0, 10))
    }
  } else if (range === '30d') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      keys.push(d.toISOString().slice(0, 10))
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      keys.push(d.toISOString().slice(0, 7))
    }
  }
  return keys
}

// ---------- Dashboard stats ----------

export interface RecentOrder {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
  customer: Pick<Customer, 'id' | 'name' | 'email'> | null
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  todayRevenue: number
  todayOrders: number
  monthRevenue: number
  monthOrders: number
  pendingOrders: number
  lowStockProducts: { id: string; name: string; stock_quantity: number }[]
  recentOrders: RecentOrder[]
  bestSellers: { product_name: string; quantity: number; total: number }[]
}

export async function fetchDashboardStats(storeId: string): Promise<DashboardStats> {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    revenueRes,
    todayRes,
    monthRes,
    productCount,
    customerCount,
    pendingRes,
    lowStockRes,
    recentOrdersRes,
    bestSellersRes,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('total')
      .eq('store_id', storeId)
      .not('status', 'in', '("cancelled","refunded")'),
    supabase
      .from('orders')
      .select('total, created_at')
      .eq('store_id', storeId)
      .gte('created_at', startOfToday.toISOString()),
    supabase
      .from('orders')
      .select('total, created_at')
      .eq('store_id', storeId)
      .gte('created_at', startOfMonth.toISOString()),
    supabase.from('products').select('id', { count: 'exact' }).eq('store_id', storeId),
    supabase.from('customers').select('id', { count: 'exact' }).eq('store_id', storeId),
    supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('store_id', storeId)
      .eq('status', 'pending'),
    supabase
      .from('products')
      .select('id, name, stock_quantity')
      .eq('store_id', storeId)
      .eq('track_inventory', true)
      .eq('status', 'active')
      .lte('stock_quantity', 5)
      .order('stock_quantity', { ascending: true })
      .limit(8),
    supabase
      .from('orders')
      .select('id, order_number, status, total, created_at, customer:customers(id, name, email)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('order_items')
      .select('product_name, quantity, total, orders!inner(store_id)')
      .eq('orders.store_id', storeId)
      .order('total', { ascending: false })
      .limit(8),
  ])

  const sum = (rows: { total?: number }[]) => rows.reduce((acc, r) => acc + Number(r.total ?? 0), 0)
  const revenueRows = revenueRes.data ?? []

  const bestSellerMap = new Map<string, { product_name: string; quantity: number; total: number }>()
  for (const item of bestSellersRes.data ?? []) {
    const existing = bestSellerMap.get(item.product_name)
    if (existing) {
      existing.quantity += item.quantity
      existing.total += Number(item.total)
    } else {
      bestSellerMap.set(item.product_name, {
        product_name: item.product_name,
        quantity: item.quantity,
        total: Number(item.total),
      })
    }
  }

  return {
    totalRevenue: sum(revenueRows),
    totalOrders: revenueRes.data?.length ?? 0,
    totalProducts: productCount.count ?? 0,
    totalCustomers: customerCount.count ?? 0,
    todayRevenue: sum(todayRes.data ?? []),
    todayOrders: todayRes.data?.length ?? 0,
    monthRevenue: sum(monthRes.data ?? []),
    monthOrders: monthRes.data?.length ?? 0,
    pendingOrders: pendingRes.count ?? 0,
    lowStockProducts: (lowStockRes.data ?? []) as DashboardStats['lowStockProducts'],
    recentOrders: (recentOrdersRes.data ?? []).map((row) => ({
      id: row.id,
      order_number: row.order_number,
      status: row.status,
      total: row.total,
      created_at: row.created_at,
      customer: Array.isArray(row.customer) ? row.customer[0] ?? null : row.customer ?? null,
    })),
    bestSellers: [...bestSellerMap.values()].sort((a, b) => b.total - a.total).slice(0, 6),
  }
}

// ---------- Settings ----------

export async function fetchSettings(storeId: string): Promise<StoreSettings | null> {
  const { data } = await supabase.from('store_settings').select('*').eq('store_id', storeId).maybeSingle()
  return (data as StoreSettings) ?? null
}

export async function updateSettings(storeId: string, patch: Partial<StoreSettings>) {
  const { error } = await supabase.from('store_settings').update(patch).eq('store_id', storeId)
  if (error) throw error
}

export async function fetchShippingMethods(storeId: string) {
  const { data, error } = await supabase
    .from('shipping_methods')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function upsertShippingMethod(input: {
  id?: string
  storeId: string
  name: string
  price: number
  free_shipping_threshold?: number | null
  is_active: boolean
}) {
  const payload = {
    id: input.id,
    store_id: input.storeId,
    name: input.name,
    price: input.price,
    free_shipping_threshold: input.free_shipping_threshold ?? null,
    is_active: input.is_active,
  }
  if (input.id) {
    delete (payload as { id?: string }).id
    const { error } = await supabase.from('shipping_methods').update(payload).eq('id', input.id)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('shipping_methods').insert(payload)
  if (error) throw error
}

export async function deleteShippingMethod(id: string) {
  const { error } = await supabase.from('shipping_methods').delete().eq('id', id)
  if (error) throw error
}

// ---------- Notifications ----------

export async function fetchNotifications(storeId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data as Notification[]) ?? []
}

// ---------- Subscription / Plans ----------

export async function fetchCurrentSubscription(storeId: string): Promise<{ plan: Plan | null; subscription: Subscription | null }> {
  const { data } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return {
    plan: (data?.plan as Plan) ?? null,
    subscription: (data as Subscription) ?? null,
  }
}

export async function fetchPlans(): Promise<Plan[]> {
  const { data } = await supabase.from('plans').select('*').order('price', { ascending: true })
  return (data as Plan[]) ?? []
}

// ---------- Coupons ----------

export async function fetchCoupons(storeId: string): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Coupon[]) ?? []
}

export async function upsertCoupon(input: {
  id?: string
  storeId: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount?: number | null
  max_uses?: number | null
  valid_from?: string | null
  valid_until?: string | null
  is_active: boolean
}): Promise<Coupon> {
  const payload = {
    id: input.id,
    store_id: input.storeId,
    code: input.code,
    type: input.type,
    value: input.value,
    min_order_amount: input.min_order_amount ?? 0,
    max_uses: input.max_uses ?? null,
    valid_from: input.valid_from ?? null,
    valid_until: input.valid_until ?? null,
    is_active: input.is_active,
  }
  if (input.id) {
    delete (payload as { id?: string }).id
    const { data, error } = await supabase.from('coupons').update(payload).eq('id', input.id).select().single()
    if (error) throw error
    return data as Coupon
  }
  const { data, error } = await supabase.from('coupons').insert(payload).select().single()
  if (error) throw error
  return data as Coupon
}

export async function deleteCoupon(id: string) {
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw error
}
