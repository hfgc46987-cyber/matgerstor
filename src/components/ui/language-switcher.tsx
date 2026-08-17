import { useI18n } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { lang, toggleLang } = useI18n();

  return (
    <button
      onClick={toggleLang}
      className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      aria-label="Toggle language"
    >
      <Globe className="h-4 w-4 text-gray-500" />
      <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
}
