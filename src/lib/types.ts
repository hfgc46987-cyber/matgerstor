export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  currency: string
  country: string | null
  phone: string | null
  email: string | null
  address: string | null
  status: 'active' | 'suspended'
  created_at: string
  updated_at: string
}

export type StoreRole = 'owner' | 'admin' | 'manager' | 'staff'

export interface StoreMember {
  id: string
  store_id: string
  user_id: string
  role: StoreRole
  created_at: string
}

export interface Category {
  id: string
  store_id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  created_at: string
}

export type ProductStatus = 'active' | 'draft' | 'archived'

export interface Product {
  id: string
  store_id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: number
  compare_price: number | null
  cost_price: number | null
  sku: string | null
  barcode: string | null
  stock_quantity: number
  track_inventory: boolean
  status: ProductStatus
  featured: boolean
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  store_id: string
  url: string
  position: number
  is_primary: boolean
  created_at: string
}

export interface Customer {
  id: string
  store_id: string
  name: string
  email: string | null
  phone: string | null
  total_orders: number
  total_spent: number
  created_at: string
  updated_at: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

export interface ShippingAddress {
  name?: string
  email?: string
  phone?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface Order {
  id: string
  store_id: string
  customer_id: string | null
  order_number: string
  status: OrderStatus
  payment_status: PaymentStatus
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  currency: string
  shipping_address: ShippingAddress | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  price: number
  total: number
  created_at: string
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
  customer?: Customer | null
}

export interface ShippingMethod {
  id: string
  store_id: string
  name: string
  price: number
  free_shipping_threshold: number | null
  is_active: boolean
  created_at: string
}

export interface StoreSettings {
  id: string
  store_id: string
  primary_color: string
  secondary_color: string
  font: string
  favicon_url: string | null
  banner_url: string | null
  footer_text: string | null
  social_links: Record<string, string>
  homepage_sections: {
    show_featured: boolean
    show_categories: boolean
    show_banner: boolean
    banner_heading: string
    banner_subheading: string
  }
  free_shipping: boolean
  custom_css?: string | null
  custom_head_html?: string | null
  custom_body_html?: string | null
  layout_style?: string | null
  free_shipping_min: number | null
  announcement_text: string | null
  announcement_link: string | null
  announcement_active: boolean
  design_config: {
    logo_size?: 'small' | 'medium' | 'large'
    product_image_ratio?: 'square' | 'portrait' | 'landscape'
    category_shape?: 'circle' | 'rounded' | 'square'
    button_style?: 'pill' | 'rounded' | 'square'
    card_style?: 'shadow' | 'border' | 'flat'
    header_layout?: 'logo-left' | 'logo-center'
    section_order?: string[]
  }
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  store_id: string
  type: string
  title: string
  message: string | null
  read: boolean
  created_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: 'user' | 'platform_admin'
  created_at: string
}

export interface Plan {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  billing_interval: 'month' | 'year'
  features: string[]
  is_active: boolean
  created_at: string
}

export interface Subscription {
  id: string
  store_id: string
  plan_id: string
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired'
  current_period_start: string
  current_period_end: string | null
  payment_provider: string | null
  payment_provider_id: string | null
  created_at: string
  updated_at: string
}

export interface ProductWithImages extends Product {
  images: ProductImage[]
  category?: Category | null
}

export interface StoreWithPlan extends Store {
  plan?: Plan | null
  subscription?: Subscription | null
}

export interface StorefrontProduct extends Product {
  category_name: string | null
  primary_image?: string | null
  images?: ProductImage[]
}

export interface Coupon {
  id: string
  store_id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount: number | null
  max_uses: number | null
  used_count: number
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
