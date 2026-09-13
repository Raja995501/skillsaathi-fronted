import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout.jsx'
import Button from '../../components/shared/Button.jsx'
import FormField from '../../components/shared/FormField.jsx'
import Alert from '../../components/shared/Alert.jsx'
import { userApi } from '../../api/userApi'
import { useAuth } from '../../context/AuthContext.jsx'
import SkillManager from './SkillManager.jsx'

const AVAILABILITY_OPTIONS = ['WEEKDAYS', 'WEEKENDS', 'EVENINGS', 'FLEXIBLE']
const ONLINE_PREF_OPTIONS = ['ONLINE', 'OFFLINE', 'BOTH']

export default function ProfilePage() {
  const { refreshUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadProfile = useCallback(async (isMounted = { current: true }) => {
    try {
      const res = await userApi.getMyProfile()
      const userData = res.data?.data || res.data
      if (!isMounted.current) return

      setProfile(userData)
      setForm({
        name: userData.name || '',
        phone: userData.phone || '',
        city: userData.city || '',
        state: userData.state || '',
        bio: userData.bio || '',
        languages: userData.languages || '',
        availability: userData.availability || '',
        onlinePreference: userData.onlinePreference || '',
      })
    } catch (err) {
      if (isMounted.current) {
        setError('Failed to load profile data')
      }
    }
  }, [])

  useEffect(() => {
    const isMounted = { current: true }
    loadProfile(isMounted)

    return () => {
      isMounted.current = false
    }
  }, [loadProfile])

  // Clear success message automatically after 4 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await userApi.updateMyProfile(form)
      await refreshUser()
      await loadProfile()
      setMessage('Profile updated successfully')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    setMessage('')
    try {
      await userApi.uploadProfilePicture(file)
      // Force refresh both context and local page state
      await Promise.all([refreshUser(), loadProfile()])
      setMessage('Profile picture updated successfully')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload picture')
    } finally {
      setUploading(false)
    }
  }

  if (!profile || !form) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-sm font-semibold text-gray-400 animate-pulse">Loading profile...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 font-sans">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-xs font-semibold text-gray-400">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Avatar Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center h-fit shadow-xs">
            <div className="relative w-28 h-28 mx-auto mb-4 group">
              <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[#4B2ECF] to-amber-500 flex items-center justify-center text-white text-3xl font-black shadow-md">
                {profile.profilePictureUrl ? (
                  <img src={profile.profilePictureUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name?.[0]?.toUpperCase()
                )}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/40 text-white text-xs font-bold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span>📸</span>
                <span>{uploading ? 'Uploading...' : 'Change'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePictureChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            <p className="font-extrabold text-gray-900 text-lg tracking-tight">{profile.name}</p>
            <p className="text-xs font-semibold text-gray-400">{profile.email}</p>

            <div className="mt-4 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200/50">
              <span>⭐</span>
              <span>{profile.averageRating ? Number(profile.averageRating).toFixed(2) : '0.00'}</span>
              <span className="text-amber-500/80">rating</span>
            </div>

            {!profile.emailVerified && (
              <div className="mt-4 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5">
                <span>⚠️</span> Email not verified
              </div>
            )}
          </div>

          {/* Right Form & Skills */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-5">
              <h2 className="text-xs uppercase tracking-wider font-extrabold text-gray-400">Basic Info</h2>

              {error && <Alert type="error">{error}</Alert>}
              {message && <Alert type="success">{message}</Alert>}

              <form onSubmit={handleSave} className="space-y-4">
                <FormField label="Name" value={form.name} onChange={handleChange('name')} />
                <FormField label="Phone" value={form.phone} onChange={handleChange('phone')} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="City" value={form.city} onChange={handleChange('city')} />
                  <FormField label="State" value={form.state} onChange={handleChange('state')} />
                </div>

                <FormField
                  label="Languages"
                  placeholder="e.g. English, Hindi"
                  value={form.languages}
                  onChange={handleChange('languages')}
                />

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={handleChange('bio')}
                    rows={3}
                    placeholder="Tell others about yourself..."
                    className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-[#4B2ECF] focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Availability</label>
                    <select
                      value={form.availability}
                      onChange={handleChange('availability')}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-[#4B2ECF] focus:bg-white transition-all"
                    >
                      <option value="">Select availability...</option>
                      {AVAILABILITY_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Mode Preference</label>
                    <select
                      value={form.onlinePreference}
                      onChange={handleChange('onlinePreference')}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-[#4B2ECF] focus:bg-white transition-all"
                    >
                      <option value="">Select mode...</option>
                      {ONLINE_PREF_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    loading={saving} 
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#4B2ECF] text-white font-bold text-sm hover:bg-[#3b22ab] transition-all shadow-md shadow-indigo-100"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>

            <SkillManager />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}