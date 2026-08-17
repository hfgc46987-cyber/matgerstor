import { Database, KeyRound, Plug } from 'lucide-react'

export default function ConnectSupabase() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <Plug className="h-7 w-7 text-primary-600" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-gray-900">Connect your Supabase project</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            This platform is fully wired to Supabase for authentication, PostgreSQL storage and
            Row Level Security. To go live you need to point it at your own Supabase project.
          </p>

          <ol className="mt-6 w-full space-y-3 text-start">
            <li className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
              <div>
                <p className="text-sm font-semibold text-gray-800">1. Create a Supabase project</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Go to supabase.com → New project. Copy the Project URL and the anon{' '}
                  <code className="rounded bg-gray-200 px-1">public</code> key.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
              <div>
                <p className="text-sm font-semibold text-gray-800">2. Run the migrations</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Apply <code className="rounded bg-gray-200 px-1">supabase/migrations</code> to
                  your project (SQL editor or <code className="rounded bg-gray-200 px-1">supabase
                  db push</code>). This creates every table, RLS policy, trigger and storage bucket.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <Plug className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
              <div>
                <p className="text-sm font-semibold text-gray-800">3. Configure the environment</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Create a <code className="rounded bg-gray-200 px-1">.env</code> file with:{' '}
                  <code className="rounded bg-gray-200 px-1">VITE_SUPABASE_URL</code> and{' '}
                  <code className="rounded bg-gray-200 px-1">VITE_SUPABASE_ANON_KEY</code>, then
                  restart the dev server. See the README for full setup instructions.
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-start text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
            <p className="font-semibold">Security note</p>
            <p className="mt-1">
              Only the anon key is used here. The service role key is never shipped to the frontend.
              Every table is protected by Row Level Security (see{' '}
              <code className="rounded bg-amber-100 px-1">20250101000002_rls_policies.sql</code>).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
