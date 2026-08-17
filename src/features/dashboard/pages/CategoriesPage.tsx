import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Tags, MoreHorizontal } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useStore } from '@/lib/store'
import { useCategoriesQuery, storeKeys } from '@/lib/queries'
import { upsertCategory, deleteCategory } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonRows } from '@/components/ui/spinner'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { useToast } from '@/components/ui/toast'
import { slugify, cn } from '@/lib/utils'
import { Category } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/ui/image-upload'

const PUBLIC_STORAGE_BASE = import.meta.env.VITE_SUPABASE_URL + '/storage/v1/object/public'

export default function CategoriesPage() {
  const { currentStore } = useStore()
  const storeId = currentStore?.id ?? ''
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const { t } = useI18n()

  const { data: categories, isLoading } = useCategoriesQuery(storeId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setSlug('')
    setSlugTouched(false)
    setDescription('')
    setParentId('')
    setImageUrl(null)
    setImageFile(null)
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setSlugTouched(true)
    setDescription(cat.description ?? '')
    setParentId(cat.parent_id ?? '')
    setImageUrl(cat.image_url ?? null)
    setImageFile(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      error(t('categories.nameRequired'))
      return
    }
    setSaving(true)
    try {
      let finalImageUrl = imageUrl
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `stores/${storeId}/categories/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from('store-assets').upload(path, imageFile, { upsert: true })
        if (upErr) throw upErr
        finalImageUrl = `${PUBLIC_STORAGE_BASE}/store-assets/${path}`
      }

      await upsertCategory({
        id: editing?.id,
        storeId,
        name: name.trim(),
        slug: slug || slugify(name),
        description: description || undefined,
        parent_id: parentId || null,
        image_url: finalImageUrl,
      })
      success(editing ? t('categories.categoryUpdated') : t('categories.categoryCreated'))
      queryClient.invalidateQueries({ queryKey: storeKeys.categories(storeId) })
      setModalOpen(false)
    } catch (e) {
      error(t('categories.couldNotSaveCategory'), (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCategory(deleteTarget.id)
      success(t('categories.categoryDeleted'))
      queryClient.invalidateQueries({ queryKey: storeKeys.categories(storeId) })
      setDeleteTarget(null)
    } catch (e) {
      error(t('categories.couldNotDeleteCategory'), (e as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  const rootCategories = categories?.filter((c) => !c.parent_id) ?? []
  const childrenOf = (parentId: string) => categories?.filter((c) => c.parent_id === parentId) ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('categories.title')}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{t('categories.subtitle')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('categories.addCategory')}
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <SkeletonRows count={6} className="p-5" />
        ) : !categories || categories.length === 0 ? (
          <EmptyState
            icon={<Tags className="h-7 w-7 text-gray-400" />}
            title={t('categories.noCategoriesYet')}
            description={t('categories.noCategoriesDesc')}
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t('categories.createCategory')}
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {rootCategories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                childrenCount={childrenOf(cat.id).length}
                depth={0}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                childrenOf={childrenOf}
              />
            ))}
            {rootCategories.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-400">
                {t('categories.allSubcategories')}
              </p>
            )}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('categories.editCategory') : t('categories.addCategory')}
        description={t('categories.modalDesc')}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? t('common.saveChanges') : t('categories.createCategory')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="catName">{t('common.name')}</Label>
            <Input
              id="catName"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!slugTouched) setSlug(slugify(e.target.value))
              }}
              placeholder={t('categories.namePlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="catSlug">{t('productForm.slug')}</Label>
            <Input
              id="catSlug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(slugify(e.target.value))
              }}
              placeholder="clothing"
            />
          </div>
          <div>
            <Label htmlFor="catParent">{t('categories.parentCategory')}</Label>
            <Select
              id="catParent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={categories?.length === 0}
            >
              <option value="">{t('categories.noneTopLevel')}</option>
              {categories
                ?.filter((c) => c.id !== editing?.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="catDesc">{t('common.description')}</Label>
            <Textarea
              id="catDesc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('categories.optionalDescription')}
            />
          </div>
          <ImageUpload
            label={t('common.image') || 'Category Image'}
            value={imageUrl}
            onChange={(url, file) => {
              setImageUrl(url)
              setImageFile(file ?? null)
            }}
            onClear={() => {
              setImageUrl(null)
              setImageFile(null)
            }}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('categories.deleteConfirmTitle', { name: deleteTarget?.name ?? '' })}
        description={t('categories.deleteConfirmDesc')}
        confirmLabel={t('categories.deleteCategory')}
        danger
        loading={deleting}
      />
    </div>
  )
}

function CategoryRow({
  category,
  childrenCount,
  depth,
  onEdit,
  onDelete,
  childrenOf,
}: {
  category: Category
  childrenCount: number
  depth: number
  onEdit: (cat: Category) => void
  onDelete: (cat: Category) => void
  childrenOf: (parentId: string) => Category[]
}) {
  const { t } = useI18n()
  return (
    <div>
      <div className={cn('flex items-center gap-3 px-5 py-3.5', depth > 0 && 'ps-12')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Tags className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {category.name}
            <span className="ms-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              {category.slug}
            </span>
          </p>
          {category.description && (
            <p className="truncate text-xs text-gray-400">{category.description}</p>
          )}
        </div>
        {childrenCount > 0 && (
          <span className="text-xs text-gray-400">{t('categories.sub', { count: childrenCount })}</span>
        )}
        <Dropdown
          trigger={
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
        >
          {(close) => (
            <>
              <DropdownItem
                onClick={() => {
                  close()
                  onEdit(category)
                }}
              >
                <Pencil className="h-4 w-4" />
                {t('common.edit')}
              </DropdownItem>
              <DropdownItem
                danger
                onClick={() => {
                  close()
                  onDelete(category)
                }}
              >
                <Trash2 className="h-4 w-4" />
                {t('common.delete')}
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
      {childrenCount > 0 && <ChildrenList parentId={category.id} onEdit={onEdit} onDelete={onDelete} childrenOf={childrenOf} />}
    </div>
  )
}

function ChildrenList({
  parentId,
  onEdit,
  onDelete,
  childrenOf,
}: {
  parentId: string
  onEdit: (cat: Category) => void
  onDelete: (cat: Category) => void
  childrenOf: (parentId: string) => Category[]
}) {
  const { t } = useI18n()
  const children = childrenOf(parentId)

  return (
    <>
      {children.map((child) => (
        <div key={child.id} className="flex items-center gap-3 border-t border-gray-50 bg-gray-50/40 px-5 py-3 ps-12">
          <div className="h-2 w-2 shrink-0 rounded-full bg-primary-300" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700">{child.name}</p>
            {child.description && (
              <p className="truncate text-xs text-gray-400">{child.description}</p>
            )}
          </div>
          <Dropdown
            trigger={
              <button className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          >
            {(close) => (
              <>
                <DropdownItem onClick={() => { close(); onEdit(child) }}>
                  <Pencil className="h-4 w-4" />
                  {t('common.edit')}
                </DropdownItem>
                <DropdownItem danger onClick={() => { close(); onDelete(child) }}>
                  <Trash2 className="h-4 w-4" />
                  {t('common.delete')}
                </DropdownItem>
              </>
            )}
          </Dropdown>
        </div>
      ))}
    </>
  )
}
