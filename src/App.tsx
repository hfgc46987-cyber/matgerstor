import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { isSupabaseConfigured } from '@/lib/supabase'
import { PageLoader } from '@/components/ui/spinner'
import { StoreProvider } from '@/lib/store'

const AuthLayout = lazy(() => import('@/features/auth/AuthLayout'))
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const SignupPage = lazy(() => import('@/features/auth/SignupPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/features/auth/VerifyEmailPage'))
const OnboardingPage = lazy(() => import('@/features/onboarding/OnboardingPage'))
const DashboardLayout = lazy(() => import('@/features/dashboard/DashboardLayout'))
const OverviewPage = lazy(() => import('@/features/dashboard/pages/OverviewPage'))
const OrdersPage = lazy(() => import('@/features/dashboard/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/features/dashboard/pages/OrderDetailPage'))
const ProductsPage = lazy(() => import('@/features/dashboard/pages/ProductsPage'))
const ProductFormPage = lazy(() => import('@/features/dashboard/pages/ProductFormPage'))
const CategoriesPage = lazy(() => import('@/features/dashboard/pages/CategoriesPage'))
const CustomersPage = lazy(() => import('@/features/dashboard/pages/CustomersPage'))
const InventoryPage = lazy(() => import('@/features/dashboard/pages/InventoryPage'))
const AnalyticsPage = lazy(() => import('@/features/dashboard/pages/AnalyticsPage'))
const MarketingPage = lazy(() => import('@/features/dashboard/pages/MarketingPage'))
const CustomizationPage = lazy(() => import('@/features/dashboard/pages/CustomizationPage'))
const SettingsPage = lazy(() => import('@/features/dashboard/pages/SettingsPage'))
const AdminLayout = lazy(() => import('@/features/admin/AdminLayout'))
const AdminOverview = lazy(() => import('@/features/admin/pages/AdminOverview'))
const AdminUsers = lazy(() => import('@/features/admin/pages/AdminUsers'))
const AdminStores = lazy(() => import('@/features/admin/pages/AdminStores'))
const AdminPlans = lazy(() => import('@/features/admin/pages/AdminPlans'))
const Storefront = lazy(() => import('@/features/storefront/Storefront'))
const LandingPage = lazy(() => import('@/features/landing/LandingPage'))
const StorefrontHome = lazy(() => import('@/features/storefront/pages/StorefrontHome'))
const StorefrontProduct = lazy(() => import('@/features/storefront/pages/StorefrontProduct'))
const StorefrontCategory = lazy(() => import('@/features/storefront/pages/StorefrontCategory'))
const StorefrontCart = lazy(() => import('@/features/storefront/pages/StorefrontCart'))
const StorefrontCheckout = lazy(() => import('@/features/storefront/pages/StorefrontCheckout'))
const StorefrontOrderSuccess = lazy(() => import('@/features/storefront/pages/StorefrontOrderSuccess'))
const ConnectSupabase = lazy(() => import('@/features/connect/ConnectSupabase'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

function RequireStore({ children }: { children: React.ReactNode }) {
  const { stores, storesLoading } = useStore()
  if (storesLoading) return <PageLoader />
  if (stores.length === 0) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) return
    import('@/lib/supabase').then(({ supabase }) =>
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => setIsAdmin(data?.role === 'platform_admin')),
    )
  }, [user])

  if (loading || isAdmin === null) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Supabase not configured */}
        <Route path="/setup" element={<ConnectSupabase />} />

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />

        {/* Store dashboard */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <RequireStore>
                <DashboardLayout />
              </RequireStore>
            </RequireAuth>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id" element={<ProductFormPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="customization" element={<CustomizationPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Platform admin */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            </RequireAuth>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="stores" element={<AdminStores />} />
          <Route path="plans" element={<AdminPlans />} />
        </Route>

        {/* Public storefront */}
        <Route path="/store/:slug" element={<Storefront />}>
          <Route index element={<StorefrontHome />} />
          <Route path="product/:productSlug" element={<StorefrontProduct />} />
          <Route path="category/:categorySlug" element={<StorefrontCategory />} />
          <Route path="cart" element={<StorefrontCart />} />
          <Route path="checkout" element={<StorefrontCheckout />} />
          <Route path="order/success" element={<StorefrontOrderSuccess />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const [configChecked, setConfigChecked] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const t = window.setTimeout(() => setConfigChecked(true), 1000)
      return () => window.clearTimeout(t)
    }
    setConfigChecked(true)
  }, [])

  if (!isSupabaseConfigured && configChecked) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ConnectSupabase />
      </Suspense>
    )
  }

  if (loading) return <PageLoader />

  return <StoreProvider>{user ? <AppRoutes /> : <AppRoutes />}</StoreProvider>
}
