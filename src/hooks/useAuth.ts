import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return { user, isAuthenticated, logout: handleLogout }
}
