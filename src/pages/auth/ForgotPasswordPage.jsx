import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import FormField from '../../components/shared/FormField.jsx'
import Button from '../../components/shared/Button.jsx'
import Alert from '../../components/shared/Alert.jsx'
import { authApi } from '../../api/authApi'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || loading) return

    setLoading(true)
    try {
      await authApi.forgotPassword(email.trim())
    } catch (err) {
      // Intentionally catch silent errors — maintaining constant security privacy state
      console.error('Password reset request completed with status log:', err)
    } finally {
      // Backend deliberately never reveals whether the email exists (security practice)
      // Frontend mirrors that by always displaying identical confirmation state.
      setLoading(false)
      setSubmitted(true)
    }
  }

  const handleResetForm = () => {
    setEmail('')
    setSubmitted(false)
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a recovery link."
    >
      {submitted ? (
        <div className="space-y-5">
          <Alert type="success">
            If an account exists for <strong className="font-bold text-emerald-950">{email}</strong>, a password reset link has been dispatched to your inbox.
          </Alert>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-600 leading-relaxed">
            <p className="font-semibold text-gray-800 mb-1">Didn't receive the email?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your spam or junk folder.</li>
              <li>Ensure the email address was entered correctly.</li>
              <li>Wait 2-3 minutes for server delivery.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleResetForm}
            className="w-full text-center text-xs font-bold text-brand-blue hover:underline py-1 cursor-pointer"
          >
            Try another email address
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            autoFocus
          />

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </Button>
        </form>
      )}

      <p className="text-center text-xs sm:text-sm text-gray-500 font-medium mt-6">
        Remembered your password?{' '}
        <Link to="/login" className="text-brand-blue font-bold hover:underline transition">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  )
}