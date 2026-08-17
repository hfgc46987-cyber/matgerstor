import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  danger = false,
  loading = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}) {
  const { t } = useI18n()
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            danger
              ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50'
              : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50'
          }
        >
          <AlertTriangle className={danger ? 'h-5 w-5 text-red-600' : 'h-5 w-5 text-amber-600'} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      </div>
    </Modal>
  )
}
