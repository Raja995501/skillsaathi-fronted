import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import UserProfilePage from './pages/profile/UserProfilePage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import ProfilePage from './pages/profile/ProfilePage.jsx'
import PublicProfilePage from './pages/profile/PublicProfilePage.jsx'
import MatchesPage from './pages/matches/MatchesPage.jsx'
import SearchPage from './pages/search/SearchPage.jsx'
import ConnectionsPage from './pages/connections/ConnectionsPage.jsx'
import ChatPage from './pages/chat/ChatPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'
import AdminSkillsPage from './pages/admin/AdminSkillsPage.jsx'
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import AdminRoute from './components/auth/AdminRoute.jsx'
import { ToastProvider } from './hooks/useToast.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { WebSocketProvider } from './context/WebSocketContext.jsx'

function App() {
  // Web Push Notification ke liye Service Worker register karna
  useEffect(() => {
    async function registerServiceWorker() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          console.log('Service Worker registered successfully:', registration)
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }
    }
    registerServiceWorker()
  }, [])

  return (
    <ToastProvider>
      <AuthProvider>
        <WebSocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/profile/:id" element={<UserProfilePage />} />

              <Route path="/dashboard" element={
                <ProtectedRoute><DashboardPage /></ProtectedRoute>
              } />
              <Route path="/dashboard/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
              <Route path="/dashboard/users/:userId" element={
                <ProtectedRoute><PublicProfilePage /></ProtectedRoute>
              } />
              <Route path="/dashboard/matches" element={
                <ProtectedRoute><MatchesPage /></ProtectedRoute>
              } />
              <Route path="/dashboard/search" element={
                <ProtectedRoute><SearchPage /></ProtectedRoute>
              } />
              <Route path="/dashboard/connections" element={
                <ProtectedRoute><ConnectionsPage /></ProtectedRoute>
              } />
              <Route path="/dashboard/chat" element={
                <ProtectedRoute><ChatPage /></ProtectedRoute>
              } />

              <Route path="/admin" element={
                <AdminRoute><AdminDashboardPage /></AdminRoute>
              } />
              <Route path="/admin/users" element={
                <AdminRoute><AdminUsersPage /></AdminRoute>
              } />
              <Route path="/admin/skills" element={
                <AdminRoute><AdminSkillsPage /></AdminRoute>
              } />
              <Route path="/admin/reports" element={
                <AdminRoute><AdminReportsPage /></AdminRoute>
              } />
            </Routes>
          </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App