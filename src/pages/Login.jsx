import { GoogleLogin } from '@react-oauth/google'
import { Moon, Sun, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { useTheme } from '../store/ThemeContext'

export default function Login() {
  const { login, error, setError } = useAuth()
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 to-brand-800 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-black/10 blur-2xl" />
        <div className="flex items-center gap-2.5 relative">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-white text-brand-700 font-extrabold">W</div>
          <span className="font-extrabold text-lg">Windesign OS</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">Run your entire<br />business from<br />one workspace.</h1>
          <p className="mt-4 text-white/80 max-w-md">Employees, payroll, invoices, clients, expenses, documents and finance — unified, secure and always in sync.</p>
        </div>
        <p className="relative text-sm text-white/60">© {new Date().getFullYear()} Windesign Studio</p>
      </div>

      {/* Auth panel */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <button onClick={toggle} className="btn-ghost !p-2 absolute top-5 right-5" title="Toggle theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-brand-600 text-white font-extrabold">W</div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-white">Windesign OS</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 mb-8">Sign in with your authorized Google account to continue.</p>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 px-4 py-3 mb-5 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-center [color-scheme:light]">
            <GoogleLogin
              onSuccess={(cr) => login(cr.credential)}
              onError={() => setError('Google sign-in failed. Please try again.')}
              theme={theme === 'dark' ? 'filled_black' : 'outline'}
              size="large"
              width="320"
              text="continue_with"
              shape="pill"
            />
          </div>

          <div className="flex items-center gap-2 mt-8 text-xs text-slate-400">
            <ShieldCheck size={14} />
            <span>Access is restricted to approved accounts. Your identity is verified by Google.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
