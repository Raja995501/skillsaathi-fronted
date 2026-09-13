import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import FormField from '../../components/shared/FormField.jsx'
import Button from '../../components/shared/Button.jsx'
import Alert from '../../components/shared/Alert.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

// Mirrors RegisterRequest's @Pattern on the backend (AuthServiceImpl) — checking client-side
// too means the user gets instant feedback instead of a round-trip 400 for a weak password.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const { register } = useAuth()
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

  const handleChange = (field) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [field]: value }))

    // Clear field-specific error dynamically when user types
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Full Name"
          placeholder="e.g. Raja Kumar"
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
          placeholder="e.g. 9955012023"
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