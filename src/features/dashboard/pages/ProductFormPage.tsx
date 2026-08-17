import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Star, Trash2, ImagePlus, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useStore } from '@/lib/store'
import { useCategoriesQuery, useProductQuery, storeKeys } from '@/lib/queries'
import { upsertProduct, setProductImages } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { slugify, cn } from '@/lib/utils'
import { ProductImage } from '@/lib/types'
import { PUBLIC_STORAGE_BASE } from '@/lib/supabase'

interface ImageRow {
  url: string
  file?: File
}

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentStore } = useStore()
  const { success, error } = useToast()
  const { t } = useI18n()
  const storeId = currentStore?.id ?? ''

  const { data: categories } = useCategoriesQuery(storeId)
  const { data: existing, isLoading: loadingExisting } = useProductQuery(storeId, id)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [stock, setStock] = useState('0')
  const [trackInventory, setTrackInventory] = useState(true)
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active')
  const [featured, setFeatured] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [images, setImages] = useState<ImageRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setSlug(existing.slug)
    setDescription(existing.description ?? '')
    setPrice(String(existing.price))
    setComparePrice(existing.compare_price != null ? String(existing.compare_price) : '')
    setCostPrice(existing.cost_price != null ? String(existing.cost_price) : '')
    setSku(existing.sku ?? '')
    setBarcode(existing.barcode ?? '')
    setStock(String(existing.stock_quantity))
    setTrackInventory(existing.track_inventory)
    setStatus(existing.status)
    setFeatured(existing.featured)
    setCategoryId(existing.category_id ?? '')
    setImages((existing.images ?? []).map((img: ProductImage) => ({ url: img.url })))
  }, [existing])

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const addImages = async (files: FileList | File[]) => {
    setUploading(true)
    const pending: ImageRow[] = []
    for (const file of Array.from(files)) {
      pending.push({ url: URL.createObjectURL(file), file })
    }
    setImages((prev) => [...prev, ...pending])
    setUploading(false)
  }

  const moveImage = (index: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      error(t('productForm.nameRequired'), t('productForm.enterProductName'))
      return
    }
    if (Number(price) < 0) {
      error(t('productForm.invalidPrice'))
      return
    }
    setSaving(true)
    try {
      const product = await upsertProduct({
        id,
        storeId,
        name: name.trim(),
        slug: slug || slugify(name),
        description: description || undefined,
        price: Number(price) || 0,
        compare_price: comparePrice ? Number(comparePrice) : null,
        cost_price: costPrice ? Number(costPrice) : null,
        sku: sku || null,
        barcode: barcode || null,
        stock_quantity: Number(stock) || 0,
        track_inventory: trackInventory,
        status,
        featured,
        category_id: categoryId || null,
      })

      // Upload pending images
      let savedImages: ImageRow[] = images
      const pendingFiles = images.filter((img) => img.file)
      if (pendingFiles.length > 0) {
        const uploaded: { url: string }[] = []
        for (const img of pendingFiles) {
          const path = `stores/${storeId}/products/${product.id}/${crypto.randomUUID()}.webp`
          const { error: upErr } = await supabase.storage
            .from('product-images')
            .upload(path, img.file!)
          if (upErr) {
            error(t('productForm.imageUploadFailed'), upErr.message)
            continue
          }
          uploaded.push({ url: `${PUBLIC_STORAGE_BASE}/product-images/${path}` })
        }
        const rest = images.filter((img) => !img.file)
        savedImages = [...rest, ...uploaded]
        setImages(savedImages)
      }

      await setProductImages(storeId, product.id, savedImages as ProductImage[])

      success(isEditing ? t('productForm.productUpdated') : t('productForm.productCreated'), t('productForm.productSaved', { name: product.name }))
      queryClient.invalidateQueries({ queryKey: storeKeys.products(storeId) })
      queryClient.invalidateQueries({ queryKey: storeKeys.product(storeId, product.id) })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', storeId] })
      navigate('/dashboard/products')
    } catch (e) {
      error(t('productForm.couldNotSaveProduct'), (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loadingExisting) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-6">
      <div className="sticky top-16 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md sm:mx-0 sm:top-4">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/products"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? t('productForm.editProduct') : t('productForm.addProduct')}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditing ? t('productForm.editSubtitle') : t('productForm.addSubtitle')}
            </p>
          </div>
        </div>
        <Button type="submit" size="lg" loading={saving}>
          <Save className="h-4 w-4" />
          {isEditing ? t('common.saveChanges') : t('productForm.addProduct')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t('productForm.basicInfo')}</CardTitle>
              <CardDescription>{t('productForm.basicInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="pname">{t('productForm.productName')}</Label>
                <Input
                  id="pname"
                  required
                  autoComplete="off"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t('productForm.productNamePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="pslug">{t('productForm.slug')}</Label>
                <Input
                  id="pslug"
                  autoComplete="off"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  placeholder={t('productForm.slugPlaceholder')}
                />
                <p className="mt-1 text-xs text-gray-400">{t('productForm.usedInUrl')}</p>
              </div>
              <div>
                <Label htmlFor="pdesc">{t('common.description')}</Label>
                <Textarea
                  id="pdesc"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('productForm.descriptionPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="pcat">{t('products.category')}</Label>
                <Select id="pcat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">{t('productForm.noCategory')}</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t('productForm.pricing')}</CardTitle>
              <CardDescription>{t('productForm.pricingDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="pprice">
                    {t('common.price')} ({currentStore?.currency ?? 'USD'})
                  </Label>
                  <Input
                    id="pprice"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="pcompare">{t('productForm.compareAtPrice')}</Label>
                  <Input
                    id="pcompare"
                    type="number"
                    step="0.01"
                    min="0"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="pcost">{t('productForm.costPrice')}</Label>
                  <Input
                    id="pcost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t('productForm.inventory')}</CardTitle>
              <CardDescription>{t('productForm.inventoryDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="psku">{t('productForm.sku')}</Label>
                  <Input
                    id="psku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. SKU-001"
                  />
                </div>
                <div>
                  <Label htmlFor="pbarcode">{t('productForm.barcode')}</Label>
                  <Input
                    id="pbarcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 1234567890123"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pstock">{t('productForm.stockQuantity')}</Label>
                  <Input
                    id="pstock"
                    type="number"
                    min="0"
                    disabled={!trackInventory}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={trackInventory}
                      onClick={() => setTrackInventory((v) => !v)}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition',
                        trackInventory ? 'bg-primary-600' : 'bg-gray-300',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                          trackInventory ? 'start-[22px]' : 'start-0.5',
                        )}
                      />
                    </button>
                    {t('productForm.trackInventory')}
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t('productForm.media')}</CardTitle>
              <CardDescription>{t('productForm.mediaDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  addImages(e.dataTransfer.files)
                }}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-gray-500 transition hover:border-primary-400 hover:text-primary-600"
              >
                <ImagePlus className="h-6 w-6" />
                <p className="text-xs font-medium">{t('productForm.dropImages')}</p>
                <label className="cursor-pointer text-xs font-semibold text-primary-600 hover:text-primary-700">
                  {t('productForm.orBrowseFiles')}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addImages(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
              {uploading && (
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('productForm.preparingImages')}
                </p>
              )}
              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">{t('productForm.primaryImageHint')}</p>
                  {images.map((img, idx) => (
                    <div key={img.url} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <img src={img.url} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                      <div className="flex-1">
                        {idx === 0 && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {t('productForm.primary')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(idx, -1)}
                          disabled={idx === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-white hover:text-gray-700 disabled:opacity-30"
                          aria-label={t('productForm.moveUp')}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 1)}
                          disabled={idx === images.length - 1}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-white hover:text-gray-700 disabled:opacity-30"
                          aria-label={t('productForm.moveDown')}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-white hover:text-red-600"
                          aria-label={t('common.remove')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t('productForm.statusVisibility')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="pstatus">{t('common.status')}</Label>
                <Select
                  id="pstatus"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'draft' | 'archived')}
                >
                  <option value="draft">{t('productStatus.draft')}</option>
                  <option value="active">{t('productStatus.active')}</option>
                  <option value="archived">{t('productStatus.archived')}</option>
                </Select>
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('productForm.featuredProduct')}</p>
                  <p className="text-xs text-gray-500">{t('productForm.featuredDesc')}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={featured}
                  onClick={() => setFeatured((v) => !v)}
                  className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition',
                    featured ? 'bg-primary-600' : 'bg-gray-300',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                      featured ? 'start-[22px]' : 'start-0.5',
                    )}
                  />
                </button>
              </label>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
