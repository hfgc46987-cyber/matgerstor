import { useRef } from 'react'
import { UploadCloud, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export function ImageUpload({
  value,
  onChange,
  onClear,
  aspect = 'square',
  label,
  hint,
  className,
}: {
  value?: string | null
  onChange: (url: string, file?: File) => void
  onClear?: () => void
  aspect?: 'square' | 'wide' | 'banner'
  label?: string
  hint?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useI18n()

  const aspectClass = {
    square: 'aspect-square',
    wide: 'aspect-[16/9]',
    banner: 'aspect-[3/1]',
  }[aspect]

  return (
    <div className={className}>
      {label && <p className="mb-1.5 text-sm font-medium text-gray-700">{label}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          onChange(URL.createObjectURL(file), file)
        }}
      />
      {value ? (
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100',
            aspectClass,
          )}
        >
          <img src={value} alt={label ?? 'Upload'} className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition hover:bg-black/30 hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-800 shadow hover:bg-white"
            >
              {t('ui.change')}
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-red-600 shadow hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-600',
            aspectClass,
          )}
        >
          <UploadCloud className="h-6 w-6" />
          <span className="text-xs font-medium">{t('ui.clickToUpload')}</span>
          {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
        </button>
      )}
    </div>
  )
}
