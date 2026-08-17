import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Users } from 'lucide-react'
import { fetchPlatformUsers, setUserRole } from '../api'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, THead, TBody, TRow, TH, TD } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonRows } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n'
import { formatDate } from '@/lib/utils'

export default function AdminUsers() {
  const { success, error } = useToast()
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['platform-users'],
    queryFn: fetchPlatformUsers,
  })

  const filtered = useMemo(() => {
    let list = users ?? []
    if (roleFilter !== 'all') list = list.filter((u) => u.role === roleFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (u) =>
          (u.full_name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [users, search, roleFilter])

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await setUserRole(userId, role as 'user' | 'platform_admin')
      success(t('admin.roleUpdated'), t('admin.roleUpdatedMsg', { role: role === 'platform_admin' ? t('admin.aPlatformAdmin') : t('admin.aRegularUser') }))
      refetch()
    } catch (e) {
      error(t('admin.couldNotUpdateRole'), (e as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('admin.usersTitle')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{t('admin.usersSubtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder={t('admin.searchUsers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-44">
          <option value="all">{t('admin.allRoles')}</option>
          <option value="user">{t('admin.user')}</option>
          <option value="platform_admin">{t('admin.platformAdminRole')}</option>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <SkeletonRows count={8} className="p-5" />
        ) : !users || users.length === 0 ? (
          <EmptyState icon={<Users className="h-7 w-7 text-gray-400" />} title={t('admin.noUsersFound')} />
        ) : (
          <Table>
            <THead>
              <TRow>
                <TH>{t('admin.user')}</TH>
                <TH>{t('common.role')}</TH>
                <TH>{t('common.stores')}</TH>
                <TH>{t('common.joined')}</TH>
                <TH className="w-44">{t('admin.setRole')}</TH>
              </TRow>
            </THead>
            <TBody>
              {filtered.map((user) => (
                <TRow key={user.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.full_name} url={user.avatar_url} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Badge variant={user.role === 'platform_admin' ? 'purple' : 'neutral'}>
                      {user.role === 'platform_admin' ? t('admin.platformAdminRole') : t('admin.user')}
                    </Badge>
                  </TD>
                  <TD className="text-gray-600">{user.store_count}</TD>
                  <TD className="text-gray-500">{formatDate(user.created_at)}</TD>
                  <TD>
                    <Select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="h-9 text-xs"
                    >
                      <option value="user">{t('admin.user')}</option>
                      <option value="platform_admin">{t('admin.platformAdminRole')}</option>
                    </Select>
                  </TD>
                </TRow>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
