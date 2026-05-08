import { LogOut, User, Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  onMobileMenuOpen?: () => void
}

export const Header = ({ onMobileMenuOpen }: HeaderProps) => {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <User className="h-5 w-5" />
            <span>{user?.name || 'User'}</span>
          </div>
          <button 
            onClick={logout}
            className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
