import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import FormField from '../../components/shared/FormField.jsx'
import Button from '../../components/shared/Button.jsx'
import Alert from '../../components/shared/Alert.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function LoginPage() {
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password || loading) return

    setError('')
    setLoading(true)
    try {
      await login(form.email.trim(), form.password)

      const fromState = location.state?.from
      const redirectTo = fromState ? `${fromState.pathname}${fromState.search || ''}` : '/dashboard'

      navigate(redirectTo, { replace: true })
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.message || 'Login failed. Please check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Google Login Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    setGoogleLoading(true)
    try {
      await googleLogin(credentialResponse.credential)

      const fromState = location.state?.from
      const redirectTo = fromState ? `${fromState.pathname}${fromState.search || ''}` : '/dashboard'

      navigate(redirectTo, { replace: true })
    } catch (err) {
      console.error('Google login error:', err)
      setError(err.response?.data?.message || 'Google login failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue your skill exchange journey.">
      {error && <Alert type="error">{error}</Alert>}

      {/* ✅ Google Login Button - Form ke upar */}
      <div className="mb-4">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google login failed. Please try again.')}
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          width="100%"
        />
        {googleLoading && (
          <p className="text-center text-xs text-gray-500 mt-2">Signing in with Google...</p>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange('email')}
          disabled={loading}
          required
          autoFocus
        />

        <div>
          <FormField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange('password')}
            disabled={loading}
            required
          />
          <div className="text-right mt-1.5">
            <Link
              to="/forgot-password"
              className="text-xs text-brand-blue font-semibold hover:underline transition"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          {loading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>

      <p className="text-center text-xs sm:text-sm text-gray-500 font-medium mt-6">
        New to Skill Equator?{' '}
        <Link to="/register" className="text-brand-blue font-bold hover:underline transition">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}