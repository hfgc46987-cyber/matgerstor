import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Check, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePlansQuery } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { SkeletonRows } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n'
import { formatMoney, cn } from '@/lib/utils'
import { Plan } from '@/lib/types'

export default function AdminPlans() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const { t } = useI18n()
  const { data: plans, isLoading } = usePlansQuery()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    price: '',
    currency: 'USD',
    billing_interval: 'month',
    features: '',
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', slug: '', price: '', currency: 'USD', billing_interval: 'month', features: '' })
    setModalOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditing(plan)
    setForm({
      name: plan.name,
      slug: plan.slug,
      price: String(plan.price),
      currency: plan.currency,
      billing_interval: plan.billing_interval,
      features: (plan.features ?? []).join('\n'),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      price: Number(form.price) || 0,
      currency: form.currency,
      billing_interval: form.billing_interval,
      features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
    }
    try {
      if (editing) {
        const { error: e } = await supabase.from('plans').update(payload).eq('id', editing.id)
        if (e) throw e
      } else {
        const { error: e } = await supabase.from('plans').insert(payload)
        if (e) throw e
      }
      success(editing ? t('admin.planUpdated') : t('admin.planCreated'))
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      setModalOpen(false)
    } catch (e) {
      error(t('admin.couldNotSavePlan'), (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('admin.plansTitle')}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {t('admin.plansSubtitle')}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('admin.newPlan')}
        </Button>
      </div>

      {isLoading ? (
        <SkeletonRows count={5} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {(plans ?? []).map((plan) => (
            <Card key={plan.id} className={cn('relative flex flex-col', plan.is_active ? '' : 'opacity-60')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.is_active && <Badge variant="success">{t('admin.active')}</Badge>}
                  {!plan.is_active && <Badge variant="neutral">{t('admin.inactive')}</Badge>}
                </div>
                <CardDescription className="capitalize">{plan.billing_interval === 'year' ? t('billing.yearlyBilling') : t('billing.monthlyBilling')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatMoney(plan.price, plan.currency)}
                  </span>
                  <span className="text-xs text-gray-400">/{plan.billing_interval}</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2">
                  {(plan.features ?? []).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400">/{plan.slug}</p>
                  <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>
                    <Pencil className="h-3.5 w-3.5" />
                    {t('common.edit')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SubscriptionList />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('admin.editPlan', { name: editing.name }) : t('admin.createPlan')}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? t('common.saveChanges') : t('admin.createPlan')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pName">{t('common.name')}</Label>
              <Input id="pName" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="pSlug">Slug</Label>
              <Input id="pSlug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pPrice">{t('common.price')}</Label>
              <Input id="pPrice" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="pCur">{t('common.currency')}</Label>
              <Select id="pCur" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="pBilling">{t('billing.billing')}</Label>
              <Select id="pBilling" value={form.billing_interval} onChange={(e) => setForm((f) => ({ ...f, billing_interval: e.target.value }))}>
                <option value="month">{t('billing.monthly')}</option>
                <option value="year">{t('billing.yearly')}</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="pFeatures">{t('admin.featuresOnePerLine')}</Label>
            <textarea
              id="pFeatures"
              rows={5}
              value={form.features}
              onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              placeholder={'1 store\nUnlimited products\n…'}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SubscriptionList() {
  const { data: plans } = usePlansQuery()
  const { t } = useI18n()

  const { data: subscriptions } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('id, status, current_period_end, created_at, stores(name, slug), plans(name)')
        .order('created_at', { ascending: false })
        .limit(20)
      return data ?? []
    },
    enabled: Boolean(plans),
  })

  if (!subscriptions || subscriptions.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> {t('admin.recentSubscriptions')}
        </CardTitle>
        <CardDescription>{t('admin.latestSubscriptions')}</CardDescription>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">{t('common.store')}</th>
              <th className="px-5 py-3">{t('common.plan')}</th>
              <th className="px-5 py-3">{t('common.status')}</th>
              <th className="px-5 py-3">{t('admin.periodEnd')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-5 py-3 font-medium text-gray-900">{sub.stores?.[0]?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{sub.plans?.[0]?.name ?? '—'}</td>
                <td className="px-5 py-3">
                  <Badge variant={sub.status === 'active' ? 'success' : sub.status === 'trialing' ? 'info' : 'neutral'}>
                    {t(`subscriptionStatus.${sub.status}`)}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
