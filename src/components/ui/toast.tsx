import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = ++toastId
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }])
      window.setTimeout(() => dismiss(id), 5000)
    },
    [dismiss],
  )

  const value: ToastContextValue = {
    toast: push,
    success: (title, message) => push('success', title, message),
    error: (title, message) => push('error', title, message),
    info: (title, message) => push('info', title, message),
    warning: (title, message) => push('warning', title, message),
  }

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  }

  const { t } = useI18n()

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed end-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg animate-slide-up',
              'border-gray-200',
            )}
          >
            <div className="mt-0.5 shrink-0">{icons[item.type]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              {item.message && <p className="mt-0.5 text-sm text-gray-500">{item.message}</p>}
            </div>
            <button
              onClick={() => dismiss(item.id)}
              className="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label={t('common.dismiss')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
