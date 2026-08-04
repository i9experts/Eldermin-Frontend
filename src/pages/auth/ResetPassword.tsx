import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import toast from 'react-hot-toast'
import authService from '../../services/auth.service'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError("Passwords don't match"); return }
    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setDone(true)
      toast.success('Password updated')
    } catch (err: any) {
      const message = err.response?.data?.message || 'This reset link is invalid or has expired'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-950 to-navy-900 flex items-center justify-center p-4">
        <Card className="border-0 shadow-2xl w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-700">This reset link is missing its token. Please use the link from your email, or request a new one from the login page.</p>
            <Button variant="navy" className="w-full mt-4" onClick={() => navigate('/login')}>Back to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 to-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img src="/eldermin-logo.png" alt="Eldermin" style={{ width: 200, objectFit: 'contain' }} />
          </div>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-4 pt-6 px-6">
            <h2 className="text-xl font-semibold text-gray-900">Set a new password</h2>
            <p className="text-sm text-gray-500">Choose a new password for your account</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {done ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-4">Your password has been updated. You can now sign in with your new password.</p>
                <Button variant="navy" className="w-full" onClick={() => navigate('/login')}>Go to Sign In</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">New Password</label>
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
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="navy" className="w-full h-11 font-semibold" disabled={loading}>
                  {loading ? 'Updating…' : 'Update Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
