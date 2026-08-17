import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageLoader } from '@/components/ui/spinner'
import { useI18n } from '@/lib/i18n'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const { t } = useI18n()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(Boolean(data.session))
    })
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      error(t('auth.invalidPassword'), t('auth.invalidPasswordMsg'))
      return
    }
    if (password !== confirm) {
      error(t('auth.passwordsDoNotMatch'))
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      error(t('auth.failedToUpdatePassword'), updateError.message)
      return
    }
    success(t('auth.passwordUpdated'), t('auth.passwordUpdatedMsg'))
    navigate('/login', { replace: true })
  }

  if (!sessionReady) {
    return (
      <div className="text-center">
        <PageLoader label={t('auth.verifyingResetLink')} />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">{t('auth.setNewPassword')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('auth.chooseStrongPassword')}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="password">{t('auth.newPassword')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder={t('auth.passwordPlaceholder')}
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={t('auth.togglePassword')}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
          <Input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder={t('auth.repeatPassword')}
            icon={<Lock className="h-4 w-4" />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {t('auth.updatePassword')}
        </Button>
      </form>
    </div>
  )
}
