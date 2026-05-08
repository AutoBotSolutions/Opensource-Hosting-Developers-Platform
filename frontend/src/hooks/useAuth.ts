import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface LoginData {
  email: string
  password: string
}

interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Initialize user state from localStorage on first render
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        return JSON.parse(storedUser)
      } catch (error) {
        localStorage.removeItem('user')
        return null
      }
    }
    return null
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const login = async (data: LoginData) => {
    setLoading(true)
    try {
      // For demo purposes, accept any email/password
      if (data.email && data.password) {
        const mockUser: AuthUser = {
          id: '1',
          email: data.email,
          name: 'John Doe',
          role: 'admin'
        }
        setUser(mockUser)
        localStorage.setItem('user', JSON.stringify(mockUser))
        toast.success('Login successful!')
        navigate('/')
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      toast.error('Login failed. Please check your credentials.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const checkAuth = useCallback(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        localStorage.removeItem('user')
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }, [])

  return {
    user,
    login,
    logout,
    checkAuth,
    loading,
    isAuthenticated: !!user
  }
}
