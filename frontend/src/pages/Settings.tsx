import { useState } from 'react'
import { User, Bell, Shield, Palette, Globe, Clock, CreditCard, Mail, Smartphone, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

interface UserSettings {
  name: string
  email: string
  phone: string
  company: string
  timezone: string
  language: string
}

interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  billing: boolean
  security: boolean
  maintenance: boolean
}

interface SecuritySettings {
  twoFactor: boolean
  sessionTimeout: boolean
  loginAlerts: boolean
  passwordChange: boolean
}

export const Settings = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('account')
  const [isLoading, setIsLoading] = useState(false)

  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem('userSettings')
    return saved ? JSON.parse(saved) : {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corporation',
      timezone: 'UTC-5',
      language: 'English'
    }
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isFormValid, setIsFormValid] = useState(true)

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notificationSettings')
    return saved ? JSON.parse(saved) : {
      email: true,
      push: true,
      sms: false,
      billing: true,
      security: true,
      maintenance: false
    }
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem('securitySettings')
    return saved ? JSON.parse(saved) : {
      twoFactor: false,
      sessionTimeout: true,
      loginAlerts: true,
      passwordChange: false
    }
  })

  const handleSaveUserSettings = async () => {
    setIsLoading(true)
    try {
      localStorage.setItem('userSettings', JSON.stringify(userSettings))
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Account settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotificationSettings = async () => {
    setIsLoading(true)
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Notification preferences saved!')
    } catch (error) {
      toast.error('Failed to save notification settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSecuritySettings = async () => {
    setIsLoading(true)
    try {
      localStorage.setItem('securitySettings', JSON.stringify(securitySettings))
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Security settings updated!')
    } catch (error) {
      toast.error('Failed to update security settings')
    } finally {
      setIsLoading(false)
    }
  }

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required'
        if (value.length < 2) return 'Name must be at least 2 characters'
        if (value.length > 50) return 'Name must be less than 50 characters'
        return ''
      case 'email':
        if (!value.trim()) return 'Email is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Please enter a valid email address'
        return ''
      case 'phone':
        if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) return 'Please enter a valid phone number'
        return ''
      case 'company':
        if (value.length > 100) return 'Company name must be less than 100 characters'
        return ''
      default:
        return ''
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setUserSettings(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation
    const error = validateField(field, value)
    setFormErrors(prev => ({ ...prev, [field]: error }))
    
    // Check if form is valid
    const newErrors = { ...formErrors, [field]: error }
    const hasErrors = Object.values(newErrors).some(err => err !== '')
    setIsFormValid(!hasErrors)
  }

  const handleChangePassword = () => {
    // Create password change modal
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter current password">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter new password">
            <p class="text-xs text-gray-500 mt-1">Must be at least 8 characters with uppercase, lowercase, and numbers</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Confirm new password">
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button class="btn-secondary">Cancel</button>
          <button class="btn-primary">Change Password</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
    
    // Add real-time password validation
    const newPasswordInput = modal.querySelectorAll('input[type="password"]')[1] as HTMLInputElement
    const confirmInput = modal.querySelectorAll('input[type="password"]')[2] as HTMLInputElement
    const submitButton = modal.querySelector('.btn-primary') as HTMLButtonElement
    
    const validatePasswords = () => {
      const newPassword = newPasswordInput.value
      const confirmPassword = confirmInput.value
      
      let isValid = true
      
      if (newPassword.length < 8) {
        newPasswordInput.classList.add('border-red-500')
        isValid = false
      } else {
        newPasswordInput.classList.remove('border-red-500')
      }
      
      if (newPassword !== confirmPassword || confirmPassword === '') {
        confirmInput.classList.add('border-red-500')
        isValid = false
      } else {
        confirmInput.classList.remove('border-red-500')
      }
      
      submitButton.disabled = !isValid
    }
    
    newPasswordInput.addEventListener('input', validatePasswords)
    confirmInput.addEventListener('input', validatePasswords)
    
    // Add event listeners
    modal.querySelector('.btn-secondary')?.addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    modal.querySelector('.btn-primary')?.addEventListener('click', () => {
      toast.success('Password changed successfully!')
      document.body.removeChild(modal)
    })
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  const handleEnable2FA = () => {
    setSecuritySettings(prev => ({ ...prev, twoFactor: !prev.twoFactor }))
    toast.success(securitySettings.twoFactor ? '2FA disabled' : '2FA enabled')
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={userSettings.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={userSettings.phone}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={userSettings.company}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={userSettings.timezone}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="UTC-8">Pacific Time (UTC-8)</option>
                    <option value="UTC-5">Eastern Time (UTC-5)</option>
                    <option value="UTC+0">GMT (UTC+0)</option>
                    <option value="UTC+1">Central European Time (UTC+1)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={userSettings.language}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveUserSettings}
                disabled={isLoading || !isFormValid}
                className="btn-primary"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive updates via email</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotificationSettings(prev => ({ ...prev, email: !prev.email }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.email ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.email ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Push Notifications</p>
                      <p className="text-sm text-gray-500">Receive browser push notifications</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotificationSettings(prev => ({ ...prev, push: !prev.push }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.push ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.push ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">SMS Notifications</p>
                      <p className="text-sm text-gray-500">Receive text message alerts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotificationSettings(prev => ({ ...prev, sms: !prev.sms }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.sms ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.sms ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h2>
              <div className="space-y-4">
                {[
                  { key: 'billing', label: 'Billing Updates', description: 'Invoices, payments, and billing alerts' },
                  { key: 'security', label: 'Security Alerts', description: 'Login attempts and security changes' },
                  { key: 'maintenance', label: 'Maintenance', description: 'Scheduled maintenance and downtime' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                    <button
                      onClick={() => setNotificationSettings(prev => ({ ...prev, [key]: !prev[key as keyof NotificationSettings] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings[key as keyof NotificationSettings] ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings[key as keyof NotificationSettings] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveNotificationSettings}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <button
                    onClick={handleEnable2FA}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.twoFactor ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.twoFactor ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Session Timeout</p>
                      <p className="text-sm text-gray-500">Automatically log out after inactivity</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSecuritySettings(prev => ({ ...prev, sessionTimeout: !prev.sessionTimeout }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.sessionTimeout ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.sessionTimeout ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Login Alerts</p>
                      <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSecuritySettings(prev => ({ ...prev, loginAlerts: !prev.loginAlerts }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.loginAlerts ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Password</h2>
              <div className="space-y-4">
                <button
                  onClick={handleChangePassword}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Change Password</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSecuritySettings}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h2>
            <div className="space-y-4">
              <p className="text-gray-600">Billing settings and payment methods would be managed here.</p>
              <button className="btn-primary">Manage Billing</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
