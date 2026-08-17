import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Mode = 'password' | 'otp'

const OTP_INPUT_LENGTH = 6

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { success, error } = useToast()
  const { t } = useI18n()

  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // OTP state
  const [otpSent, setOtpSent] = useState(false)
  const [otpToken, setOtpToken] = useState('')
  const [resendIn, setResendIn] = useState(0)

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  useEffect(() => {
    if (resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [resendIn])

  const sendOtp = async () => {
    if (!email) {
      error(t('auth.emailRequired'), t('auth.emailRequiredMsg'))
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    })
    setLoading(false)
    if (authError) {
      error(t('auth.couldNotSendCode'), authError.message)
      return
    }
    setOtpSent(true)
    setResendIn(60)
    success(t('auth.codeSent'), t('auth.codeSentMsg', { email }))
  }

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (otpToken.length !== OTP_INPUT_LENGTH) {
      error(t('auth.invalidCode'), t('auth.invalidCodeMsg'))
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.verifyOtp({
      email,
      token: otpToken,
      type: 'email',
    })
    setLoading(false)
    if (authError) {
      error(t('auth.verificationFailed'), authError.message)
      return
    }
    success(t('auth.signedIn'), t('auth.welcomeBackMsg'))
    navigate(from, { replace: true })
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      error(t('auth.signInFailed'), authError.message)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">{t('auth.welcomeBack')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('auth.signInSubtitle')}</p>

      {/* Mode toggle */}
      <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode('password')}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            mode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          {t('auth.passwordMode')}
        </button>
        <button
          type="button"
          onClick={() => setMode('otp')}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            mode === 'otp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          {t('auth.otpMode')}
        </button>
      </div>

      {mode === 'password' ? (
        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••"
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
            {t('auth.signInButton')}
          </Button>
        </form>
      ) : otpSent ? (
        <form onSubmit={verifyOtp} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="otp">{t('auth.oneTimeCode')}</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_INPUT_LENGTH}
              required
              placeholder="••••••"
              icon={<KeyRound className="h-4 w-4" />}
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              {t('auth.otpHint', { email })}
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {t('auth.verifyAndSignIn')}
          </Button>

          <div className="flex items-center justify-center gap-2 text-sm">
            <button
              type="button"
              disabled={resendIn > 0}
              onClick={sendOtp}
              className="font-medium text-primary-600 hover:text-primary-700 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              {resendIn > 0 ? t('auth.resendCodeIn', { seconds: resendIn }) : t('auth.resendCode')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOtpSent(false)}
            className="mx-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            {t('auth.useDifferentEmail')} <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); sendOtp() }} className="mt-6 space-y-4">
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
            <p className="mt-1.5 text-xs text-gray-400">
              {t('auth.otpEmailHint')}
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {t('auth.sendCode')}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        {t('auth.dontHaveAccount')}{' '}
        <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
          {t('auth.createOne')}
        </Link>
      </p>
    </div>
  )
}
