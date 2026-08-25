import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import authService from '../../services/auth.service'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { role } = await login(email, password)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 to-navy-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="w-full max-w-md relative">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img src="/eldermin-logo.png" alt="Eldermin" style={{ width: 200, objectFit: "contain" }} />
          </div>
          <p className="text-gold-400 mt-1 font-medium tracking-wider text-sm">
            Elevate. Administer. Excel.
          </p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-4 pt-6 px-6">
            <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500">Sign in to your account to continue</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="admin@eduos.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
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
                  <input type="checkbox" className="rounded border-gray-300 text-navy-900" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSent(false); }}
                  className="text-gold-600 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                variant="navy"
                className="w-full h-11 font-semibold"
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
                ) : 'Sign In'}
              </Button>
            </form>

            <div className="mt-5 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Demo credentials</p>
              <p className="text-xs text-gray-600">Email: <span className="font-mono">admin@demo-school.com</span></p>
              <p className="text-xs text-gray-600">Password: <span className="font-mono">Admin@1234</span></p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-navy-400 text-sm mt-6">
          © {new Date().getFullYear()} Eldermin. All rights reserved.
        </p>
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
