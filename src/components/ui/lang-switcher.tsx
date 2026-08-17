import { Languages } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function LangSwitcher({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useI18n()
  const other = lang === 'ar' ? 'en' : 'ar'

  return (
    <button
      type="button"
      onClick={() => setLang(other)}
      title={other === 'ar' ? 'العربية' : 'English'}
      aria-label={other === 'ar' ? 'العربية' : 'English'}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition',
        dark
          ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700'
          : 'border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50',
      )}
    >
      <Languages className="h-3.5 w-3.5" />
      <span>{other === 'ar' ? 'عربي' : 'EN'}</span>
    </button>
  )
}
