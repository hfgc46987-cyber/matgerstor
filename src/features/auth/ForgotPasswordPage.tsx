import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n'

export default function ForgotPasswordPage() {
  const { success, error } = useToast()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (authError) {
      error(t('auth.failedToSendReset'), authError.message)
      return
    }
    setSent(true)
    success(t('auth.resetLinkSent'), t('auth.resetLinkMsg'))
  }

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <Send className="h-6 w-6 text-emerald-600" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('auth.resetLinkSent')}</h1>
        <p className="mt-2 text-sm text-gray-500">
          {t('auth.resetLinkSentBody', { email })}
        </p>
        <Link to="/login">
          <Button variant="outline" className="mt-6 w-full">
            {t('auth.backToSignIn')}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">{t('auth.forgotYourPassword')}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {t('auth.forgotSubtitle')}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">{t('auth.emailAddress')}</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder={t('auth.emailPlaceholder')}
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {t('auth.sendResetLink')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        {t('auth.rememberedIt')}{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  )
}
