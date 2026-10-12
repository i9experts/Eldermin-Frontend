import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, X, ArrowRight, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import authService from '../../services/auth.service'

const DEMO_EMAIL = 'admin@demo-school.com'
const DEMO_PASSWORD = 'Admin@1234'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const { login, loginWithToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const slug = params.get('slug')
    if (token && slug) {
      setLoading(true)
      loginWithToken(token, slug)
        .then(() => navigate('/dashboard', { replace: true }))
        .catch(() => {
          setError('Auto-login failed. Please sign in manually.')
          setLoading(false)
        })
    }
    // Remembered email from a previous "Remember me" sign-in on this browser.
    const remembered = localStorage.getItem('rememberedEmail')
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { role } = await login(email, password)
      if (rememberMe) localStorage.setItem('rememberedEmail', email)
      else localStorage.removeItem('rememberedEmail')
      toast.success('Welcome back!')
      // reseller_admin/reseller_support belong in the separate Reseller
      // Portal (its own session, see AuthContext.login) - not the regular
      // school dashboard, which would otherwise render empty/zeroed-out
      // since these accounts have no school Tenant at all.
      navigate(role === 'reseller_admin' || role === 'reseller_support' ? '/partner' : '/dashboard')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid credentials'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await authService.forgotPassword(forgotEmail)
      setForgotSent(true)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong - please try again')
    } finally {
      setForgotLoading(false)
    }
  }

  function exploreDemo() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError('')
    toast.success('Demo credentials filled in - click Sign in to continue.')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* ─── Left: brand panel ──────────────────────────────────────────── */}
      {/* A single exact image of the brand panel (logo, tagline, headline and
          the isometric illustration) rather than recreating it piece by piece
          in markup - this is marketing chrome, not live content, so pixel
          fidelity to the design matters more than it being DOM text. */}
      <div className="relative lg:w-1/2 lg:min-h-screen overflow-hidden" style={{ background: '#082744' }}>
        <img
          src="/login-brand-panel.webp"
          alt="Eldermin - Elevate. Administer. Excel. Your school, connected: a clearer view of every school day."
          className="w-full h-full object-cover"
        />
      </div>

      {/* ─── Right: login form ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSent(false); }}
            className="flex items-center gap-1.5 text-sm text-navy-700 hover:text-navy-900 font-medium transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Need help?
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm py-6">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1.5 mb-8">Sign in to your school workspace.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-sm font-semibold text-gray-800">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-navy-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-sm font-semibold text-gray-800">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus-visible:ring-navy-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-navy-900 focus:ring-navy-500"
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSent(false); }}
                  className="text-gold-600 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                variant="navy"
                className="w-full h-12 rounded-xl font-semibold text-base"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            </div>

            <button
              type="button"
              onClick={exploreDemo}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-navy-700 hover:text-navy-900 font-semibold transition-colors"
            >
              Explore the demo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-gray-400 pb-4">
          <span>© {new Date().getFullYear()} Eldermin</span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span>Privacy</span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span>Terms</span>
        </div>
      </div>

      {showForgot && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setShowForgot(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            {forgotSent ? (
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
                <p className="text-sm text-gray-500">
                  If an account exists for <strong>{forgotEmail}</strong>, a password reset link has been sent. It's valid for 1 hour.
                </p>
                <Button variant="navy" className="w-full mt-4" onClick={() => setShowForgot(false)}>Back to Sign In</Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Reset your password</h3>
                <p className="text-sm text-gray-500 mb-4">Enter your email and we'll send you a reset link.</p>
                <div className="relative mb-4">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@school.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <Button type="submit" variant="navy" className="w-full" disabled={forgotLoading}>
                  {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
