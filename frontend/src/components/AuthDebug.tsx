import { useAuth } from '@/hooks/useAuth'

export const AuthDebug = () => {
  const { user, isAuthenticated, checkAuth } = useAuth()

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>User: {user ? JSON.stringify(user) : 'None'}</p>
      <button 
        onClick={checkAuth}
        className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
      >
        Check Auth
      </button>
    </div>
  )
}
