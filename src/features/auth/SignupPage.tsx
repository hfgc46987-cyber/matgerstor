import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n'

export default function SignupPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const { t } = useI18n()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      error(t('auth.invalidPassword'), t('auth.invalidPasswordMsg'))
      return
    }
    setLoading(true)
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    })
    setLoading(false)

    if (authError) {
      error(t('auth.signUpFailed'), authError.message)
      return
    }

    if (data.session) {
      success(t('auth.accountCreated'), t('auth.welcomeToStorecraft'))
      navigate('/onboarding', { replace: true })
    } else {
      setNeedsVerification(true)
    }
  }

  if (needsVerification) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('auth.checkYourEmail')}</h1>
        <p className="mt-2 text-sm text-gray-500">
          {t('auth.confirmationSentMsg', { email })}
        </p>
        <Button variant="outline" className="mt-6 w-full" onClick={() => navigate('/login')}>
          {t('auth.goToSignIn')}
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">{t('auth.createAccount')}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {t('auth.signupSubtitle')}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="fullName">{t('auth.fullName')}</Label>
          <Input
            id="fullName"
            required
            placeholder={t('auth.fullNamePlaceholder')}
            icon={<User className="h-4 w-4" />}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="email">{t('auth.emailAddress')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder={t('auth.emailPlaceholder')}
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">{t('auth.password')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {t('auth.createAccountButton')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  )
}
