import { useEffect, useState, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Alert from '../../components/shared/Alert.jsx'
import Button from '../../components/shared/Button.jsx'
import { authApi } from '../../api/authApi'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('')

  // Ref to prevent double execution during React 18 Strict Mode mounts
  const isCalledRef = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the URL link.')
      return
    }

    if (isCalledRef.current) return
    isCalledRef.current = true

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus('success')
      })
      .catch((err) => {
        console.error('Email verification failed:', err)
        setStatus('error')
        setMessage(
          err.response?.data?.message ||
            'This verification link is invalid, altered, or has expired.'
        )
      })
  }, [token])

  return (
    <AuthLayout
      title="Email Verification"
      subtitle={
        status === 'verifying'
          ? 'Confirming your account details...'
          : status === 'success'
          ? 'Account successfully verified!'
          : 'Verification issue encountered'
      }
    >
      {/* Loading State */}
      {status === 'verifying' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="w-10 h-10 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
          <p className="text-xs sm:text-sm font-semibold text-gray-500">
            Verifying your email token, please wait...
          </p>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && (
        <div className="space-y-5">
          <Alert type="success">
            Your email has been successfully verified! You can now log in and access all features.
          </Alert>

          <Link to="/login" className="block w-full">
            <Button className="w-full">Go to Login</Button>
          </Link>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="space-y-5">
          <Alert type="error">{message}</Alert>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
            <p className="font-bold mb-1">Need a new link?</p>
            <p>
              If your verification link expired, log in to your account or re-register to receive a fresh verification link in your inbox.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/login" className="flex-1">
              <Button className="w-full">Go to Login</Button>
            </Link>
            <Link to="/register" className="flex-1">
              <Button variant="secondary" className="w-full">
                Re-Register
              </Button>
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}