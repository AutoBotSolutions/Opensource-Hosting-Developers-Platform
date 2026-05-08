import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export const Layout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleMobileClose = () => {
    setIsMobileOpen(false)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        onMobileClose={handleMobileClose} 
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header onMobileMenuOpen={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
