import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Megaphone, Tag } from 'lucide-react'
import { useStore } from '@/lib/store'
import { fetchCoupons, upsertCoupon, deleteCoupon, fetchSettings, updateSettings } from '@/lib/api'
import { Coupon, StoreSettings } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useI18n } from '@/lib/i18n'

export default function MarketingPage() {
  const { currentStore } = useStore()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'coupons' | 'announcements'>('coupons')
  
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<StoreSettings | null>(null)

  useEffect(() => {
    if (!currentStore) return
    Promise.all([
      fetchCoupons(currentStore.id),
      fetchSettings(currentStore.id)
    ]).then(([c, s]) => {
      setCoupons(c)
      setSettings(s)
      setLoading(false)
    })
  }, [currentStore])

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    await deleteCoupon(id)
    setCoupons(coupons.filter(c => c.id !== id))
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.marketing')}</h1>
      </div>

      <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center whitespace-nowrap gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'coupons'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Tag className="w-4 h-4" />
          Coupons & Discounts
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center whitespace-nowrap gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'announcements'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Store Announcement
        </button>
      </div>

      {activeTab === 'coupons' ? (
        <CouponsTab coupons={coupons} setCoupons={setCoupons} storeId={currentStore!.id} onDelete={handleDeleteCoupon} />
      ) : (
        <AnnouncementTab settings={settings!} storeId={currentStore!.id} />
      )}
    </div>
  )
}

function CouponsTab({ coupons, setCoupons, storeId, onDelete }: { coupons: Coupon[], setCoupons: any, storeId: string, onDelete: (id: string) => void }) {
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ code: '', type: 'percentage', value: 0, min_order_amount: 0 })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const newCoupon = await upsertCoupon({
      storeId,
      code: formData.code.toUpperCase(),
      type: formData.type as 'percentage' | 'fixed',
      value: formData.value,
      min_order_amount: formData.min_order_amount,
      is_active: true
    })
    setCoupons([newCoupon, ...coupons])
    setIsCreating(false)
    setFormData({ code: '', type: 'percentage', value: 0, min_order_amount: 0 })
  }

  if (isCreating) {
    return (
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-200 space-y-4 max-w-md">
        <h3 className="font-semibold text-lg">Create New Coupon</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">Coupon Code</label>
          <Input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. SUMMER20" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Discount Type</label>
          <Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount</option>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Discount Value</label>
          <Input type="number" step="0.01" min="0" required value={formData.value || ''} onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Minimum Order Amount (Optional)</label>
          <Input type="number" step="0.01" min="0" value={formData.min_order_amount || ''} onChange={e => setFormData({...formData, min_order_amount: parseFloat(e.target.value)})} />
        </div>
        
        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
          <Button type="submit">Create Coupon</Button>
        </div>
      </form>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-semibold text-gray-900">Active Coupons</h2>
        <Button onClick={() => setIsCreating(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Create Coupon
        </Button>
      </div>
      
      {coupons.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <Tag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p>No coupons created yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">Code</th>
                <th className="px-6 py-3 font-medium text-gray-500">Discount</th>
                <th className="px-6 py-3 font-medium text-gray-500">Uses</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map(c => (
                <tr key={c.id}>
                  <td className="px-6 py-4 font-semibold">{c.code}</td>
                  <td className="px-6 py-4">
                    {c.type === 'percentage' ? `${c.value}%` : `$${c.value}`}
                  </td>
                  <td className="px-6 py-4">{c.used_count}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onDelete(c.id)} className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AnnouncementTab({ settings, storeId }: { settings: StoreSettings, storeId: string }) {
  const [formData, setFormData] = useState({
    announcement_active: settings.announcement_active ?? false,
    announcement_text: settings.announcement_text || '',
    announcement_link: settings.announcement_link || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await updateSettings(storeId, formData)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-200 space-y-6 max-w-2xl">
      <div>
        <h3 className="font-semibold text-lg text-gray-900 mb-1">Store Announcement Bar</h3>
        <p className="text-sm text-gray-500">Display a banner at the very top of your storefront to announce sales, free shipping, or important updates.</p>
      </div>

      <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
        <input 
          type="checkbox" 
          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500" 
          checked={formData.announcement_active}
          onChange={e => setFormData({...formData, announcement_active: e.target.checked})}
        />
        <span className="font-medium">Enable Announcement Bar</span>
      </label>

      {formData.announcement_active && (
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Text</label>
            <Input 
              required 
              value={formData.announcement_text} 
              onChange={e => setFormData({...formData, announcement_text: e.target.value})} 
              placeholder="e.g. Free shipping on all orders over $50!" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
            <Input 
              value={formData.announcement_link} 
              onChange={e => setFormData({...formData, announcement_link: e.target.value})} 
              placeholder="e.g. /category/sale" 
            />
            <p className="text-xs text-gray-500 mt-1">Make the banner clickable and link to a specific page or product.</p>
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-end border-t border-gray-100">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}
