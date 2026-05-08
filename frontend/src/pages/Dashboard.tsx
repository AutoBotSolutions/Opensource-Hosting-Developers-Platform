import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Server, CreditCard, HelpCircle, Users, TrendingUp, Activity } from 'lucide-react'
import toast from 'react-hot-toast'

interface DashboardStats {
  activeServers: number
  monthlyRevenue: number
  supportTickets: number
  totalClients: number
  serverUptime: number
  newClients: number
}

interface RecentActivity {
  id: string
  type: 'server' | 'client' | 'support' | 'billing'
  description: string
  timestamp: string
}

export const Dashboard = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    activeServers: 12,
    monthlyRevenue: 2450,
    supportTickets: 8,
    totalClients: 156,
    serverUptime: 99.9,
    newClients: 12
  })
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'client',
      description: 'New client registered: John Smith',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      type: 'server',
      description: 'Server WEB-01 restarted successfully',
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      type: 'support',
      description: 'Support ticket #1234 resolved',
      timestamp: '6 hours ago'
    },
    {
      id: '4',
      type: 'billing',
      description: 'Payment received: $79.99',
      timestamp: '8 hours ago'
    }
  ])

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'server': return <Server className="h-5 w-5" />
      case 'client': return <Users className="h-5 w-5" />
      case 'support': return <HelpCircle className="h-5 w-5" />
      case 'billing': return <CreditCard className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  useEffect(() => {
    // Listen for real-time updates from other pages
    const handleDataUpdate = (event: CustomEvent) => {
      const { type, data } = event.detail
      
      switch (type) {
        case 'server_created':
          setStats(prev => ({
            ...prev,
            activeServers: prev.activeServers + 1
          }))
          break
        case 'server_status_changed':
          setStats(prev => ({
            ...prev,
            activeServers: data.status === 'active' ? prev.activeServers + 1 : prev.activeServers - 1
          }))
          break
        case 'invoice_paid':
          setStats(prev => ({
            ...prev,
            monthlyRevenue: prev.monthlyRevenue + data.amount
          }))
          break
        case 'ticket_created':
          setStats(prev => ({
            ...prev,
            supportTickets: prev.supportTickets + 1
          }))
          break
        case 'ticket_closed':
          setStats(prev => ({
            ...prev,
            supportTickets: Math.max(0, prev.supportTickets - 1)
          }))
          break
      }
    }

    // Keyboard shortcuts
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Help modal
      if (event.key === '?' || (event.key === '/' && !event.ctrlKey && !event.metaKey)) {
        event.preventDefault()
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
        modal.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Keyboard Shortcuts</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-sm font-medium">Add Server</span>
                <kbd class="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl+H</kbd>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-sm font-medium">Add Client</span>
                <kbd class="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl+C</kbd>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-sm font-medium">Support</span>
                <kbd class="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl+S</kbd>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-sm font-medium">Billing</span>
                <kbd class="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl+B</kbd>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-sm font-medium">Refresh Data</span>
                <kbd class="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl+R</kbd>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm font-medium">Close</span>
                <kbd class="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Esc</kbd>
              </div>
            </div>
            <div class="flex justify-end mt-6">
              <button class="btn-primary">Close</button>
            </div>
          </div>
        `
        document.body.appendChild(modal)
        
        const closeModal = () => document.body.removeChild(modal)
        modal.querySelector('.btn-primary')?.addEventListener('click', closeModal)
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal()
        })
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closeModal()
        }, { once: true })
        return
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'h':
            event.preventDefault()
            navigate('/hosting')
            setTimeout(() => {
              const event = new CustomEvent('openAddServiceModal')
              window.dispatchEvent(event)
            }, 100)
            toast.success('Keyboard shortcut: Add Server (Ctrl+H)')
            break
          case 'c':
            event.preventDefault()
            // Create client modal
            const modal = document.createElement('div')
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
            modal.innerHTML = `
              <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Add New Client</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input type="text" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter client name">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="client@example.com">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input type="text" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Company name">
                  </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                  <button class="btn-secondary">Cancel</button>
                  <button class="btn-primary">Add Client</button>
                </div>
              </div>
            `
            document.body.appendChild(modal)
            
            modal.querySelector('.btn-secondary')?.addEventListener('click', () => {
              document.body.removeChild(modal)
            })
            
            modal.querySelector('.btn-primary')?.addEventListener('click', () => {
              toast.success('Client added successfully!')
              document.body.removeChild(modal)
            })
            
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                document.body.removeChild(modal)
              }
            })
            toast.success('Keyboard shortcut: Add Client (Ctrl+C)')
            break
          case 's':
            event.preventDefault()
            navigate('/support')
            toast.success('Keyboard shortcut: Support (Ctrl+S)')
            break
          case 'b':
            event.preventDefault()
            navigate('/billing')
            toast.success('Keyboard shortcut: Billing (Ctrl+B)')
            break
          case 'r':
            event.preventDefault()
            setIsLoading(true)
            setTimeout(() => {
              setStats(prev => ({
                ...prev,
                activeServers: Math.floor(Math.random() * 20) + 5,
                monthlyRevenue: Math.floor(Math.random() * 5000) + 1000,
                supportTickets: Math.floor(Math.random() * 15) + 1,
                totalClients: Math.floor(Math.random() * 200) + 100,
                serverUptime: Math.floor(Math.random() * 5) + 95,
                newClients: Math.floor(Math.random() * 20) + 5
              }))
              setIsLoading(false)
              toast.success('Keyboard shortcut: Refresh Data (Ctrl+R)')
            }, 1000)
            break
        }
      }
    }

    window.addEventListener('dataUpdate', handleDataUpdate as EventListener)
    window.addEventListener('keydown', handleKeyboardShortcuts)
    
    return () => {
      window.removeEventListener('dataUpdate', handleDataUpdate as EventListener)
      window.removeEventListener('keydown', handleKeyboardShortcuts)
    }
  }, [navigate, setIsLoading])

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'server': return 'text-blue-600 bg-blue-100'
      case 'client': return 'text-green-600 bg-green-100'
      case 'support': return 'text-yellow-600 bg-yellow-100'
      case 'billing': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Press <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">?</kbd> for keyboard shortcuts
          </p>
        </div>
        <button 
          onClick={async () => {
            setIsLoading(true)
            try {
              // Simulate data refresh with loading
              await new Promise(resolve => setTimeout(resolve, 1000))
              setStats(prev => ({
                ...prev,
                activeServers: Math.floor(Math.random() * 20) + 5,
                monthlyRevenue: Math.floor(Math.random() * 5000) + 1000,
                supportTickets: Math.floor(Math.random() * 15) + 1,
                totalClients: Math.floor(Math.random() * 200) + 100,
                serverUptime: Math.floor(Math.random() * 5) + 95,
                newClients: Math.floor(Math.random() * 20) + 5
              }))
              toast.success('Dashboard data refreshed!')
            } catch (error) {
              toast.error('Failed to refresh data')
            } finally {
              setIsLoading(false)
            }
          }}
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Refreshing...
            </>
          ) : (
            'Refresh Data'
          )}
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Servers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeServers}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${stats.monthlyRevenue}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Support Tickets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.supportTickets}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <HelpCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalClients}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Uptime</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.serverUptime}%</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Clients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">+{stats.newClients}</p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="group relative">
              <button 
                onClick={() => {
                  navigate('/hosting')
                  setTimeout(() => {
                    const event = new CustomEvent('openAddServiceModal')
                    window.dispatchEvent(event)
                  }, 100)
                }}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left transform hover:scale-105"
                title="Add a new server to your hosting account (Ctrl+H)"
              >
                <div className="flex items-center justify-between mb-2">
                  <Server className="h-6 w-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
                  <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-900 transition-colors">Add Server</p>
                <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">Deploy new server</p>
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Add Server (Ctrl+H)
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                // Create a simple client management modal
                const modal = document.createElement('div')
                modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
                modal.innerHTML = `
                  <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Add New Client</h3>
                    <div class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                        <input type="text" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter client name">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="client@example.com">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <input type="text" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Company name">
                      </div>
                    </div>
                    <div class="flex justify-end space-x-3 mt-6">
                      <button class="btn-secondary">Cancel</button>
                      <button class="btn-primary">Add Client</button>
                    </div>
                  </div>
                `
                document.body.appendChild(modal)
                
                // Add event listeners
                modal.querySelector('.btn-secondary')?.addEventListener('click', () => {
                  document.body.removeChild(modal)
                })
                
                modal.querySelector('.btn-primary')?.addEventListener('click', () => {
                  toast.success('Client added successfully!')
                  document.body.removeChild(modal)
                })
                
                modal.addEventListener('click', (e) => {
                  if (e.target === modal) {
                    document.body.removeChild(modal)
                  }
                })
              }}
              className="group p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 hover:shadow-md transition-all duration-200 text-left transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="h-6 w-6 text-green-600 group-hover:text-green-700 transition-colors" />
                <span className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  +
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-green-900 transition-colors">Add Client</p>
              <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">Register new client</p>
            </button>
            <button 
              onClick={() => {
                navigate('/support')
                toast.success('Navigated to support tickets')
              }}
              className="group p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-yellow-300 hover:shadow-md transition-all duration-200 text-left transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-2">
                <HelpCircle className="h-6 w-6 text-yellow-600 group-hover:text-yellow-700 transition-colors" />
                <span className="text-xs text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  💬
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-yellow-900 transition-colors">Support</p>
              <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">View tickets</p>
            </button>
            <button 
              onClick={() => {
                navigate('/billing')
                toast.success('Navigated to billing')
              }}
              className="group p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="h-6 w-6 text-purple-600 group-hover:text-purple-700 transition-colors" />
                <span className="text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  $
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-purple-900 transition-colors">Billing</p>
              <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">View invoices</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
