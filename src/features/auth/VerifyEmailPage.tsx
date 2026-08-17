import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/spinner'
import { useI18n } from '@/lib/i18n'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { t } = useI18n()
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      supabase.auth
        .verifyOtp({ type: 'email', token_hash: token })
        .then(({ error: err }) => setState(err ? 'error' : 'success'))
    } else {
      setState('success')
    }
  }, [params])

  if (state === 'loading') return <PageLoader label={t('auth.verifyingEmail')} />

  return (
    <div className="animate-fade-in text-center">
      {state === 'success' ? (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('auth.emailVerified')}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {t('auth.emailVerifiedMsg')}
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
            {t('auth.goToSignIn')}
          </Button>
        </>
      ) : (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-7 w-7 text-red-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('auth.verificationFailedTitle')}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {t('auth.verificationFailedMsg')}
          </p>
          <Button variant="outline" className="mt-6 w-full" onClick={() => navigate('/login')}>
            {t('auth.backToSignIn')}
          </Button>
        </>
      )}
    </div>
  )
}
