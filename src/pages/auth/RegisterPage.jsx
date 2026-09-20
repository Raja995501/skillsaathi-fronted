import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import FormField from '../../components/shared/FormField.jsx'
import Button from '../../components/shared/Button.jsx'
import Alert from '../../components/shared/Alert.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const { register, googleLogin } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    state: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleChange = (field) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [field]: value }))

    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const validate = () => {
    const errors = {}

    if (!form.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!form.email.trim()) {
      errors.email = 'Email is required'
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      errors.email = 'Enter a valid email address'
    }

    if (!form.password) {
      errors.password = 'Password is required'
    } else if (form.password.length < 8) {
      errors.password = 'At least 8 characters required'
    } else if (!PASSWORD_PATTERN.test(form.password)) {
      errors.password = 'Must include uppercase, lowercase, and a number'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate() || loading) return

    setLoading(true)
    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
    }

    try {
      await register(payload)
      setSuccess(true)
    } catch (err) {
      const backendFieldErrors = err.response?.data?.fieldErrors
      if (backendFieldErrors) {
        setFieldErrors(backendFieldErrors)
      }
      setError(err.response?.data?.message || 'Registration failed. Please check details and try again.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Google Register Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    setGoogleLoading(true)
    try {
      // Google se signup/login karein (backend automatically naya user bana dega)
      await googleLogin(credentialResponse.credential)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Google signup error:', err)
      setError(err.response?.data?.message || 'Google signup failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout title="Check your email" subtitle="Account created successfully!">
        <div className="space-y-4">
          <Alert type="success">
            We've sent a verification link to <strong className="font-bold text-emerald-950">{form.email}</strong>. Please verify your email before logging in.
          </Alert>

          <Button onClick={() => navigate('/login')} className="w-full">
            Go to Login
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start teaching and learning with skilled peers across India."
    >
      {error && <Alert type="error">{error}</Alert>}

      {/* ✅ Google Signup Button - Form ke upar */}
      <div className="mb-4">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google signup failed. Please try again.')}
          theme="outline"
          size="large"
          text="signup_with"
          shape="rectangular"
          width="100%"
        />
        {googleLoading && (
          <p className="text-center text-xs text-gray-500 mt-2">Signing up with Google...</p>
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
          label="Full Name"
          placeholder=""
          value={form.name}
          onChange={handleChange('name')}
          error={fieldErrors.name}
          disabled={loading}
          required
          autoFocus
        />

        <FormField
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange('email')}
          error={fieldErrors.email}
          disabled={loading}
          required
        />

        <FormField
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange('password')}
          error={fieldErrors.password}
          disabled={loading}
          required
        />

        <FormField
          label="Phone (Optional)"
          type="tel"
          placeholder=" "
          value={form.phone}
          onChange={handleChange('phone')}
          error={fieldErrors.phone}
          disabled={loading}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="City"
            placeholder="e.g. Patna"
            value={form.city}
            onChange={handleChange('city')}
            error={fieldErrors.city}
            disabled={loading}
          />
          <FormField
            label="State"
            placeholder="e.g. Bihar"
            value={form.state}
            onChange={handleChange('state')}
            error={fieldErrors.state}
            disabled={loading}
          />
        </div>

        <Button type="submit" loading={loading} className="w-full mt-2">
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-xs sm:text-sm text-gray-500 font-medium mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-blue font-bold hover:underline transition">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}