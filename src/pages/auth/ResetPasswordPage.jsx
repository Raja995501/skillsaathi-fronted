import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import FormField from '../../components/shared/FormField.jsx'
import Button from '../../components/shared/Button.jsx'
import Alert from '../../components/shared/Alert.jsx'
import { authApi } from '../../api/authApi'
import { useToast } from '../../hooks/useToast.jsx'

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

export default function ResetPasswordPage() {
  const showToast = useToast()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('No reset token found in the URL. Please request a new password reset link.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!PASSWORD_PATTERN.test(password)) {
      setError('Password must include at least one uppercase letter, one lowercase letter, and one number.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      showToast('Password reset successfully! Please log in with your new credentials.', 'success')
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Password reset failed:', err)
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Ensure your new password meets complexity requirements."
    >
      {!token && (
        <Alert type="error">
          Invalid recovery link. No reset token was provided in the URL.
        </Alert>
      )}

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!token || loading}
          required
          autoFocus
        />

        <FormField
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={!token || loading}
          required
        />

        <Button type="submit" loading={loading} disabled={!token} className="w-full mt-2">
          {loading ? 'Updating Password...' : 'Reset Password'}
        </Button>
      </form>

      <p className="text-center text-xs sm:text-sm text-gray-500 font-medium mt-6">
        Remembered your password?{' '}
        <Link to="/login" className="text-brand-blue font-bold hover:underline transition">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  )
}