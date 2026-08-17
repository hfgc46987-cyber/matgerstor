import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '../cart-context'
import { useToast } from '@/components/ui/toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/lib/i18n'
import { formatMoney } from '@/lib/utils'
import { Store, StoreSettings, ShippingMethod, Coupon } from '@/lib/types'

interface OutletCtx {
  store: Store
  settings: StoreSettings | null
  theme: { primary: string }
}

export default function StorefrontCheckout() {
  const { store, settings, theme } = useOutletContext<OutletCtx>()
  const { slug } = useParams<{ slug: string }>()
  const { items, subtotal, clearCart } = useCart()
  const { success, error } = useToast()
  const { t } = useI18n()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [notes, setNotes] = useState('')
  const [shippingMethodId, setShippingMethodId] = useState('')
  const [placing, setPlacing] = useState(false)
  
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  const { data: shippingMethods } = useQuery({
    queryKey: ['storefront-shipping', store.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('price', { ascending: true })
      return (data as ShippingMethod[]) ?? []
    },
    enabled: Boolean(store.id),
  })

  const freeShippingEnabled = settings?.free_shipping ?? false
  const freeShippingMin = settings?.free_shipping_min ?? null

  const shippingCost = useMemo(() => {
    if (!shippingMethodId) return 0
    const method = shippingMethods?.find((m) => m.id === shippingMethodId)
    if (!method) return 0
    if (freeShippingEnabled && freeShippingMin != null && subtotal >= freeShippingMin) return 0
    return method.price
  }, [shippingMethodId, shippingMethods, freeShippingEnabled, freeShippingMin, subtotal])

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.value) / 100
    }
    return Math.min(appliedCoupon.value, subtotal)
  }, [appliedCoupon, subtotal])

  const total = Math.max(0, subtotal - discountAmount) + shippingCost

  const applyCoupon = async () => {
    if (!couponCode) return
    setApplyingCoupon(true)
    setCouponError('')
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('store_id', store.id)
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle()
      
    if (error || !data) {
      setCouponError('Invalid or expired coupon')
      setApplyingCoupon(false)
      return
    }
    
    if (data.min_order_amount && subtotal < data.min_order_amount) {
      setCouponError(`Minimum order amount is ${formatMoney(data.min_order_amount, store.currency)}`)
      setApplyingCoupon(false)
      return
    }
    
    if (data.max_uses && data.used_count >= data.max_uses) {
      setCouponError('Coupon limit reached')
      setApplyingCoupon(false)
      return
    }

    const now = new Date()
    if (data.valid_from && new Date(data.valid_from) > now) {
      setCouponError('Coupon is not valid yet')
      setApplyingCoupon(false)
      return
    }
    if (data.valid_until && new Date(data.valid_until) < now) {
      setCouponError('Coupon has expired')
      setApplyingCoupon(false)
      return
    }

    setAppliedCoupon(data as Coupon)
    setCouponError('')
    setCouponCode('')
    setApplyingCoupon(false)
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      error(t('checkout.cartIsEmpty'))
      return
    }
    setPlacing(true)
    const selectedMethod = shippingMethods?.find((m) => m.id === shippingMethodId)

    const { data, error: rpcError } = await supabase.rpc('create_order', {
      p_store_id: store.id,
      p_customer_name: name,
      p_customer_email: email || null,
      p_customer_phone: phone || null,
      p_shipping_address: {
        name,
        email: email || undefined,
        phone: phone || undefined,
        line1: line1 || undefined,
        line2: line2 || undefined,
        city: city || undefined,
        state: state || undefined,
        postal_code: postalCode || undefined,
        country: country || undefined,
      },
      p_notes: notes || null,
      p_shipping_method_name: selectedMethod?.name ?? null,
      p_shipping_cost: shippingCost,
      p_discount: discountAmount,
      p_coupon_code: appliedCoupon?.code ?? null,
      p_items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    })

    setPlacing(false)

    if (rpcError) {
      error(t('checkout.checkoutFailed'), rpcError.message)
      return
    }

    success(t('checkout.orderPlaced'), t('checkout.orderReceived', { number: data?.order_number ?? '' }))
    clearCart()
    navigate(`/store/${slug}/order/success?order=${data?.id ?? ''}&number=${data?.order_number ?? ''}`)
  }

  if (items.length === 0 && !placing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-lg font-semibold text-gray-900">{t('cart.empty')}</p>
        <Link to={`/store/${slug}`} className="mt-3 inline-block text-sm font-medium" style={{ color: theme.primary }}>
          {t('common.continueShopping')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('checkout.title')}</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Contact */}
          <section className="rounded-xl border border-gray-100 bg-white p-5">
            <h2 className="text-sm font-bold text-gray-900">{t('checkout.contactInformation')}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="coName">{t('checkout.fullName')}</Label>
                <Input id="coName" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('checkout.fullNamePlaceholder')} />
              </div>
              <div>
                <Label htmlFor="coEmail">{t('common.email')}</Label>
                <Input id="coEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="coPhone">{t('checkout.phoneOptional')}</Label>
                <Input id="coPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section className="rounded-xl border border-gray-100 bg-white p-5">
            <h2 className="text-sm font-bold text-gray-900">{t('checkout.shippingAddress')}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="ad1">{t('common.address')}</Label>
                <Input id="ad1" required value={line1} onChange={(e) => setLine1(e.target.value)} placeholder={t('checkout.addressPlaceholder')} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="ad2">{t('checkout.apartmentOptional')}</Label>
                <Input id="ad2" value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Apt 4B" />
              </div>
              <div>
                <Label htmlFor="adCity">{t('checkout.city')}</Label>
                <Input id="adCity" required value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="adState">{t('checkout.stateProvince')}</Label>
                <Input id="adState" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="adZip">{t('checkout.postalCode')}</Label>
                <Input id="adZip" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="adCountry">{t('common.country')}</Label>
                <Input id="adCountry" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Shipping method */}
          {shippingMethods && shippingMethods.length > 0 && (
            <section className="rounded-xl border border-gray-100 bg-white p-5">
              <h2 className="text-sm font-bold text-gray-900">{t('checkout.shippingMethod')}</h2>
              <div className="mt-4 space-y-2">
                {shippingMethods.map((method) => {
                  const free = freeShippingEnabled && freeShippingMin != null && subtotal >= freeShippingMin
                  return (
                    <label
                      key={method.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 p-3.5 transition has-checked:border-primary-500 has-checked:bg-primary-50/40"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value={method.id}
                          checked={shippingMethodId === method.id}
                          onChange={() => setShippingMethodId(method.id)}
                          className="h-4 w-4 accent-primary-600"
                        />
                        <span className="text-sm font-medium text-gray-900">{method.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {free || method.price === 0 ? t('common.free') : formatMoney(method.price, store.currency)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>
          )}

          {/* Notes */}
          <section className="rounded-xl border border-gray-100 bg-white p-5">
            <Label htmlFor="coNotes">{t('checkout.orderNotesOptional')}</Label>
            <Textarea
              id="coNotes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('checkout.notesPlaceholder')}
            />
          </section>
        </div>

        {/* Summary */}
        <div>
          <div className="sticky top-20 rounded-xl border border-gray-100 bg-white p-5">
            <h2 className="text-base font-bold text-gray-900">{t('checkout.summary')}</h2>
            <div className="mt-4 max-h-60 space-y-3 overflow-y-auto pe-1">
              {items.map((item) => (
                <div key={item.product_id} className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-300">img</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{t('checkout.qty', { quantity: item.quantity })}</p>
                  </div>
                  <p className="text-xs font-semibold text-gray-900">
                    {formatMoney(item.price * item.quantity, store.currency)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{t('common.subtotal')}</span>
                <span className="font-medium text-gray-900">{formatMoney(subtotal, store.currency)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span className="font-medium">-{formatMoney(discountAmount, store.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>{t('common.shipping')}</span>
                <span className="font-medium text-gray-900">
                  {shippingMethodId ? formatMoney(shippingCost, store.currency) : '—'}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
                <span>{t('common.total')}</span>
                <span>{formatMoney(total, store.currency)}</span>
              </div>
            </div>
            
            <div className="mt-4 border-t border-gray-100 pt-4">
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <Input 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value)} 
                    placeholder="Discount code" 
                    className="h-10"
                  />
                  <button 
                    type="button" 
                    onClick={applyCoupon}
                    disabled={applyingCoupon || !couponCode}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium transition disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-100">
                  <span className="text-sm font-medium text-green-700">{appliedCoupon.code} applied</span>
                  <button type="button" onClick={removeCoupon} className="text-xs text-green-700 hover:text-green-900 font-medium">Remove</button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
            </div>

            <button
              type="submit"
              disabled={placing}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: theme.primary }}
            >
              {placing && <Loader2 className="h-4 w-4 animate-spin" />}
              {placing ? t('checkout.placingOrder') : t('checkout.placeOrder', { total: formatMoney(total, store.currency) })}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('checkout.secureInfo')}
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
