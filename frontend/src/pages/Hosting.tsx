import { useState, useEffect } from 'react'
import { Plus, Activity, Settings, Power, HardDrive, Server, Cpu, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'

interface HostingPlan {
  id: string
  name: string
  type: 'shared' | 'vps' | 'dedicated'
  status: 'active' | 'inactive' | 'suspended'
  specs: {
    cpu: number
    ram: string
    storage: string
    bandwidth: string
  }
  price: number
  uptime: number
  createdAt: string
}

export const Hosting = () => {
  const [plans, setPlans] = useState<HostingPlan[]>([
    {
      id: '1',
      name: 'Premium Hosting',
      type: 'shared',
      status: 'active',
      specs: {
        cpu: 2,
        ram: '4GB',
        storage: '100GB SSD',
        bandwidth: 'Unlimited'
      },
      price: 29.99,
      uptime: 99.9,
      createdAt: '2023-01-15'
    },
    {
      id: '2',
      name: 'VPS Server',
      type: 'vps',
      status: 'active',
      specs: {
        cpu: 4,
        ram: '8GB',
        storage: '200GB SSD',
        bandwidth: '5TB'
      },
      price: 79.99,
      uptime: 99.8,
      createdAt: '2023-03-20'
    },
    {
      id: '3',
      name: 'Dedicated Server',
      type: 'dedicated',
      status: 'inactive',
      specs: {
        cpu: 8,
        ram: '16GB',
        storage: '1TB SSD',
        bandwidth: '10TB'
      },
      price: 199.99,
      uptime: 0,
      createdAt: '2023-06-10'
    }
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<HostingPlan | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [newService, setNewService] = useState({
    name: '',
    type: 'shared' as const,
    cpu: 1,
    ram: '1GB',
    storage: '50GB SSD',
    bandwidth: '1TB',
    price: 29.99
  })

  useEffect(() => {
    const handleOpenAddServiceModal = () => {
      setShowAddModal(true)
    }

    window.addEventListener('openAddServiceModal', handleOpenAddServiceModal)
    return () => {
      window.removeEventListener('openAddServiceModal', handleOpenAddServiceModal)
    }
  }, [])

  const getStatusColor = (status: HostingPlan['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: HostingPlan['type']) => {
    switch (type) {
      case 'shared': return <Server className="h-5 w-5" />
      case 'vps': return <Cpu className="h-5 w-5" />
      case 'dedicated': return <HardDrive className="h-5 w-5" />
      default: return <Server className="h-5 w-5" />
    }
  }

  const handleToggleStatus = (planId: string) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const newStatus = plan.status === 'active' ? 'inactive' : 'active'
        
        // Emit real-time update event
        window.dispatchEvent(new CustomEvent('dataUpdate', {
          detail: { type: 'server_status_changed', data: { status: newStatus, plan } }
        }))
        
        toast.success(`Server ${plan.name} ${newStatus === 'active' ? 'started' : 'stopped'}`)
        return { ...plan, status: newStatus }
      }
      return plan
    }))
  }

  const handleManageSettings = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    setSelectedPlan(plan || null)
    setShowSettingsModal(true)
  }

  const handleViewStats = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    setSelectedPlan(plan || null)
    setShowStatsModal(true)
  }

  const handleCreateService = async () => {
    // Enhanced validation
    if (!newService.name.trim()) {
      toast.error('Please enter a service name')
      return
    }

    if (newService.name.length < 3) {
      toast.error('Service name must be at least 3 characters long')
      return
    }

    if (newService.price < 0) {
      toast.error('Price must be a positive number')
      return
    }

    if (newService.price > 10000) {
      toast.error('Price seems too high. Please check the amount.')
      return
    }

    // Show loading state
    const loadingToast = toast.loading('Creating service...')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      const service: HostingPlan = {
        id: Date.now().toString(),
        name: newService.name.trim(),
        type: newService.type,
        status: 'inactive',
        specs: {
          cpu: newService.cpu,
          ram: newService.ram,
          storage: newService.storage,
          bandwidth: newService.bandwidth
        },
        price: newService.price,
        uptime: 0,
        createdAt: new Date().toISOString().split('T')[0]
      }

      setPlans(prev => [service, ...prev])
      
      // Emit real-time update event
      window.dispatchEvent(new CustomEvent('dataUpdate', {
        detail: { type: 'server_created', data: { service } }
      }))
      
      toast.success(`Service "${newService.name}" created successfully!`, { id: loadingToast })
      setShowAddModal(false)
      setNewService({
        name: '',
        type: 'shared',
        cpu: 1,
        ram: '1GB',
        storage: '50GB SSD',
        bandwidth: '1TB',
        price: 29.99
      })
    } catch (error) {
      toast.error('Failed to create service. Please try again.', { id: loadingToast })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hosting Services</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2 group hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
          <span>Add New Service</span>
        </button>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Servers</p>
              <p className="text-2xl font-bold text-gray-900">
                {plans.filter(p => p.status === 'active').length}
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">
                ${plans.filter(p => p.status === 'active').reduce((sum, p) => sum + p.price, 0).toFixed(2)}
              </p>
            </div>
            <Server className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Uptime</p>
              <p className="text-2xl font-bold text-gray-900">
                {plans.filter(p => p.status === 'active').length > 0 
                  ? (plans.filter(p => p.status === 'active').reduce((sum, p) => sum + p.uptime, 0) / plans.filter(p => p.status === 'active').length).toFixed(1)
                  : '0'}%
              </p>
            </div>
            <Wifi className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Hosting Plans */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="card">
            <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="transform group-hover:scale-110 transition-transform duration-200">
                    {getTypeIcon(plan.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.type} hosting</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(plan.status)} group-hover:scale-105 transition-transform`}>
                  {plan.status}
                </span>
              </div>
                
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">CPU</p>
                  <p className="font-medium">{plan.specs.cpu} cores</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">RAM</p>
                  <p className="font-medium">{plan.specs.ram}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Storage</p>
                  <p className="font-medium">{plan.specs.storage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bandwidth</p>
                  <p className="font-medium">{plan.specs.bandwidth}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-primary-600">${plan.price}/month</p>
                  {plan.status === 'active' && (
                    <p className="text-sm text-gray-500">Uptime: {plan.uptime}%</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewStats(plan.id)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Statistics"
                  >
                    <Activity className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleManageSettings(plan.id)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Manage Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(plan.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      plan.status === 'active' 
                        ? 'text-red-600 hover:text-red-700 hover:bg-red-100' 
                        : 'text-green-600 hover:text-green-700 hover:bg-green-100'
                    }`}
                    title={plan.status === 'active' ? 'Stop Server' : 'Start Server'}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Service</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="My Server"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <select
                    value={newService.type}
                    onChange={(e) => setNewService(prev => ({ ...prev, type: e.target.value as HostingPlan['type'] }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="shared">Shared Hosting</option>
                    <option value="vps">VPS</option>
                    <option value="dedicated">Dedicated Server</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPU Cores</label>
                  <select
                    value={newService.cpu}
                    onChange={(e) => setNewService(prev => ({ ...prev, cpu: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="1">1 Core</option>
                    <option value="2">2 Cores</option>
                    <option value="4">4 Cores</option>
                    <option value="8">8 Cores</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RAM</label>
                  <select
                    value={newService.ram}
                    onChange={(e) => setNewService(prev => ({ ...prev, ram: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="1GB">1GB</option>
                    <option value="2GB">2GB</option>
                    <option value="4GB">4GB</option>
                    <option value="8GB">8GB</option>
                    <option value="16GB">16GB</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage</label>
                  <select
                    value={newService.storage}
                    onChange={(e) => setNewService(prev => ({ ...prev, storage: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="50GB SSD">50GB SSD</option>
                    <option value="100GB SSD">100GB SSD</option>
                    <option value="250GB SSD">250GB SSD</option>
                    <option value="500GB SSD">500GB SSD</option>
                    <option value="1TB SSD">1TB SSD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bandwidth</label>
                  <select
                    value={newService.bandwidth}
                    onChange={(e) => setNewService(prev => ({ ...prev, bandwidth: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="1TB">1TB</option>
                    <option value="5TB">5TB</option>
                    <option value="10TB">10TB</option>
                    <option value="Unlimited">Unlimited</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price ($)</label>
                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="29.99"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateService}
                className="btn-primary"
              >
                Create Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Server Settings - {selectedPlan.name}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Server Name</label>
                  <input
                    type="text"
                    defaultValue={selectedPlan.name}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option>{selectedPlan.type}</option>
                    <option>shared</option>
                    <option>vps</option>
                    <option>dedicated</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auto-restart on failure</label>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Backup Schedule</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success(`Settings updated for ${selectedPlan.name}`)
                  setShowSettingsModal(false)
                }}
                className="btn-primary"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Server Statistics - {selectedPlan.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card">
                <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(Math.random() * 40) + 10}%</p>
              </div>
              <div className="card">
                <p className="text-sm font-medium text-gray-600">Memory</p>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(Math.random() * 60) + 20}%</p>
              </div>
              <div className="card">
                <p className="text-sm font-medium text-gray-600">Disk Space</p>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(Math.random() * 80) + 10}%</p>
              </div>
              <div className="card">
                <p className="text-sm font-medium text-gray-600">Network</p>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(Math.random() * 100) + 50}MB/s</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Performance Overview</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-medium">{Math.floor(Math.random() * 100) + 20}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Uptime (24h)</span>
                    <span className="text-sm font-medium">{(Math.random() * 2 + 97).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Requests/min</span>
                    <span className="text-sm font-medium">{Math.floor(Math.random() * 1000) + 500}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowStatsModal(false)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
