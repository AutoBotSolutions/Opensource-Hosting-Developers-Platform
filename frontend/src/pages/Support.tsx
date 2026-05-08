import { useState, useEffect } from 'react'
import { Plus, MessageSquare, X, Search, AlertCircle, Clock, CheckCircle, Archive, MessageCircle, User, Reply } from 'lucide-react'
import toast from 'react-hot-toast'

interface SupportTicket {
  id: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  category: string
  createdAt: string
  updatedAt: string
  messages: {
    id: string
    sender: 'user' | 'support'
    content: string
    timestamp: string
  }[]
}

export const Support = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: '1',
      subject: 'Server downtime issue',
      description: 'My VPS server has been down for the last 2 hours. I need urgent assistance.',
      status: 'in_progress',
      priority: 'high',
      category: 'Technical',
      createdAt: '2023-12-01T10:00:00Z',
      updatedAt: '2023-12-01T12:00:00Z',
      messages: [
        {
          id: '1',
          sender: 'user',
          content: 'My VPS server has been down for the last 2 hours. I need urgent assistance.',
          timestamp: '2023-12-01T10:00:00Z'
        },
        {
          id: '2',
          sender: 'support',
          content: 'We are investigating the issue. Our team is working on it.',
          timestamp: '2023-12-01T11:30:00Z'
        }
      ]
    },
    {
      id: '2',
      subject: 'Billing question',
      description: 'I was charged twice for my hosting plan this month.',
      status: 'resolved',
      priority: 'medium',
      category: 'Billing',
      createdAt: '2023-11-28T14:00:00Z',
      updatedAt: '2023-11-29T09:00:00Z',
      messages: [
        {
          id: '1',
          sender: 'user',
          content: 'I was charged twice for my hosting plan this month.',
          timestamp: '2023-11-28T14:00:00Z'
        },
        {
          id: '2',
          sender: 'support',
          content: 'We have processed a refund for the duplicate charge. It should appear in your account within 3-5 business days.',
          timestamp: '2023-11-29T09:00:00Z'
        }
      ]
    },
    {
      id: '3',
      subject: 'Domain transfer help',
      description: 'I need help transferring my domain to your service.',
      status: 'open',
      priority: 'low',
      category: 'Domain',
      createdAt: '2023-12-02T09:00:00Z',
      updatedAt: '2023-12-02T09:00:00Z',
      messages: [
        {
          id: '1',
          sender: 'user',
          content: 'I need help transferring my domain to your service.',
          timestamp: '2023-12-02T09:00:00Z'
        }
      ]
    }
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showTicketDetail, setShowTicketDetail] = useState(false)
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium' as const,
    category: 'Technical'
  })

  // Button analytics tracking
  const trackButtonClick = (buttonName: string, action: string) => {
    const analytics = {
      buttonName,
      action,
      timestamp: new Date().toISOString(),
      page: 'support',
      userAgent: navigator.userAgent,
      sessionId: sessionStorage.getItem('sessionId') || 'anonymous'
    }
    
    // Store analytics in localStorage
    const existingAnalytics = JSON.parse(localStorage.getItem('buttonAnalytics') || '[]')
    existingAnalytics.push(analytics)
    
    // Keep only last 1000 events
    if (existingAnalytics.length > 1000) {
      existingAnalytics.splice(0, existingAnalytics.length - 1000)
    }
    
    localStorage.setItem('buttonAnalytics', JSON.stringify(existingAnalytics))
    
    // Emit analytics event for real-time tracking
    window.dispatchEvent(new CustomEvent('buttonAnalytics', {
      detail: analytics
    }))
  }

  // Ripple effect function
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const ripple = document.createElement('span')
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2
    
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = x + 'px'
    ripple.style.top = y + 'px'
    ripple.classList.add('ripple')
    
    // Add ripple styles
    const style = document.createElement('style')
    style.textContent = `
      .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
      }
      @keyframes ripple-animation {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
    
    button.appendChild(ripple)
    
    setTimeout(() => {
      ripple.remove()
      style.remove()
    }, 600)
  }

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <Archive className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast.error('Please fill in all fields')
      return
    }

    setIsCreatingTicket(true)
    
    try {
      // Simulate API call with loading
      await new Promise(resolve => setTimeout(resolve, 1500))

      const ticket: SupportTicket = {
        id: Date.now().toString(),
        subject: newTicket.subject,
        description: newTicket.description,
        status: 'open',
        priority: newTicket.priority,
        category: newTicket.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: '1',
            sender: 'user',
            content: newTicket.description,
            timestamp: new Date().toISOString()
          }
        ]
      }

      setTickets(prev => [ticket, ...prev])
      
      // Emit real-time update event
      window.dispatchEvent(new CustomEvent('dataUpdate', {
        detail: { type: 'ticket_created', data: { ticket } }
      }))
      
      toast.success('Support ticket created successfully!')
      setShowCreateModal(false)
      setNewTicket({ subject: '', description: '', priority: 'medium' as const, category: 'Technical' })
    } catch (error) {
      toast.error('Failed to create ticket. Please try again.')
    } finally {
      setIsCreatingTicket(false)
    }
  }

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setShowTicketDetail(true)
  }

  const handleReplyToTicket = (ticketId: string, message: string) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          messages: [
            ...ticket.messages,
            {
              id: Date.now().toString(),
              sender: 'user',
              content: message,
              timestamp: new Date().toISOString()
            }
          ],
          updatedAt: new Date().toISOString(),
          status: 'in_progress' as const
        }
      }
      return ticket
    }))
    toast.success('Reply sent successfully!')
  }

  const handleCloseTicket = (ticketId: string) => {
    // Create confirmation modal
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Close Ticket</h3>
        <p class="text-gray-600 mb-4">Are you sure you want to close this ticket? This action cannot be undone.</p>
        <div class="flex justify-end space-x-3">
          <button class="btn-secondary">Cancel</button>
          <button class="btn-primary">Close Ticket</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
    
    // Add event listeners
    modal.querySelector('.btn-secondary')?.addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    modal.querySelector('.btn-primary')?.addEventListener('click', () => {
      setTickets(prev => prev.map(ticket => {
        if (ticket.id === ticketId) {
          return { ...ticket, status: 'closed', updatedAt: new Date().toISOString() }
        }
        return ticket
      }))
      
      // Emit real-time update event
      window.dispatchEvent(new CustomEvent('dataUpdate', {
        detail: { type: 'ticket_closed', data: { ticketId } }
      }))
      
      toast.success('Ticket closed successfully!')
      document.body.removeChild(modal)
    })
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  const openTickets = tickets.filter(t => t.status === 'open').length
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length

  useEffect(() => {
    // Keyboard shortcuts for support page
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault()
            setShowCreateModal(true)
            toast.success('Keyboard shortcut: Create New Ticket (Ctrl+N)')
            break
          case 'f':
            event.preventDefault()
            toast.success('Keyboard shortcut: Search (Ctrl+F) - Feature coming soon!')
            break
          case '1':
            event.preventDefault()
            toast.success('Keyboard shortcut: Filter Open Tickets (Ctrl+1)')
            break
          case '2':
            event.preventDefault()
            toast.success('Keyboard shortcut: Filter In Progress Tickets (Ctrl+2)')
            break
          case '3':
            event.preventDefault()
            toast.success('Keyboard shortcut: Filter Resolved Tickets (Ctrl+3)')
            break
        }
      }

      // Help modal
      if (event.key === '?' || (event.key === '/' && !event.ctrlKey && !event.metaKey)) {
        event.preventDefault()
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
        modal.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Support Page Shortcuts</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-sm font-medium">Create New Ticket</span>
                <kbd class="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl+N</kbd>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-sm font-medium">Search Tickets</span>
                <kbd class="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl+F</kbd>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-sm font-medium">Filter Open</span>
                <kbd class="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl+1</kbd>
              </div>
              <div class="flex justify-between items-center py-2 border-b">
                <span class="text-sm font-medium">Filter In Progress</span>
                <kbd class="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl+2</kbd>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm font-medium">Filter Resolved</span>
                <kbd class="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl+3</kbd>
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
    }

    window.addEventListener('keydown', handleKeyboardShortcuts)
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts)
    }
  }, [setShowCreateModal])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Press <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">?</kbd> for keyboard shortcuts
          </p>
        </div>
        <button 
          onClick={(e) => {
            createRipple(e)
            trackButtonClick('create-ticket', 'open-modal')
            setShowCreateModal(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              createRipple(e as any)
              trackButtonClick('create-ticket', 'keyboard-activate')
              setShowCreateModal(true)
            }
          }}
          className="btn-primary flex items-center space-x-2 group hover:shadow-2xl transform hover:scale-105 transition-all duration-300 active:scale-95 touch-manipulation relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50"
          role="button"
          aria-label="Create new support ticket"
          aria-describedby="create-ticket-help create-ticket-status create-ticket-instructions"
          aria-expanded={showCreateModal}
          aria-pressed={showCreateModal}
          aria-haspopup="dialog"
          tabIndex={0}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-400"></div>
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300 relative z-10 group-hover:drop-shadow-lg" aria-hidden="true" />
          <span className="hidden sm:inline relative z-10 group-hover:text-white transition-colors duration-300 group-hover:font-semibold">Create New Ticket</span>
          <span className="sm:hidden relative z-10 group-hover:text-white transition-colors duration-300 group-hover:font-semibold">New Ticket</span>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        </button>
        <span id="create-ticket-help" className="sr-only">
          Opens a modal to create a new support ticket. Use keyboard shortcut Ctrl+N or press Enter to activate.
        </span>
        <span id="create-ticket-instructions" className="sr-only">
          This button opens a dialog where you can create a new support ticket. You can navigate using Tab key and activate with Enter or Space.
        </span>
        <span id="create-ticket-status" className="sr-only" aria-live="polite" aria-atomic="true">
          {showCreateModal ? 'Ticket creation modal is open. You can now fill out the form to create a new support ticket.' : 'Ticket creation modal is closed.'}
        </span>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">Open</p>
              <p className="text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">{openTickets}</p>
            </div>
            <div className="transform group-hover:scale-110 transition-transform duration-200">
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 group-hover:text-yellow-700 transition-colors">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600 group-hover:text-yellow-700 transition-colors">{inProgressTickets}</p>
            </div>
            <div className="transform group-hover:scale-110 transition-transform duration-200">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 group-hover:text-green-700 transition-colors">Resolved</p>
              <p className="text-2xl font-bold text-green-600 group-hover:text-green-700 transition-colors">{resolvedTickets}</p>
            </div>
            <div className="transform group-hover:scale-110 transition-transform duration-200">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Total</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-900 transition-colors">{tickets.length}</p>
            </div>
            <div className="transform group-hover:scale-110 transition-transform duration-200">
              <MessageCircle className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Your Tickets</h2>
          <select className="btn-secondary text-sm">
            <option>All Status</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>
        </div>
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{ticket.category}</span>
                    </span>
                    <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                    <span>{ticket.messages.length} messages</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewTicket(ticket)}
                    className="btn-primary text-sm"
                  >
                    View
                  </button>
                  {ticket.status !== 'closed' && (
                    <button
                      onClick={() => handleCloseTicket(ticket.id)}
                      className="btn-secondary text-sm"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Ticket</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Brief description of your issue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option>Technical</option>
                    <option>Billing</option>
                    <option>Domain</option>
                    <option>Account</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as SupportTicket['priority'] }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Detailed description of your issue"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="btn-primary"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showTicketDetail && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{selectedTicket.subject}</h3>
              <button
                onClick={() => setShowTicketDetail(false)}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Ticket Info */}
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusIcon(selectedTicket.status)}
                  <span className="ml-1">{selectedTicket.status.replace('_', ' ')}</span>
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
                <span className="text-sm text-gray-500">{selectedTicket.category}</span>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                {selectedTicket.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-primary-200' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== 'closed' && (
                <div className="border-t pt-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Type your reply..."
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          handleReplyToTicket(selectedTicket.id, e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Type your reply..."]') as HTMLInputElement
                        if (input?.value.trim()) {
                          handleReplyToTicket(selectedTicket.id, input.value)
                          input.value = ''
                        }
                      }}
                      className="btn-primary"
                    >
                      <Reply className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
