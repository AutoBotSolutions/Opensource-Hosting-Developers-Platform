import { useState } from 'react'
import { CreditCard, Download, Eye, DollarSign, Calendar, AlertCircle, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface Invoice {
  id: string
  number: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  dueDate: string
  paidDate?: string
  description: string
  items: {
    name: string
    quantity: number
    price: number
  }[]
}

interface PaymentMethod {
  id: string
  type: 'card' | 'bank'
  lastFour: string
  brand: string
  isDefault: boolean
}

export const Billing = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      number: 'INV-1234',
      amount: 29.99,
      status: 'pending',
      dueDate: '2023-12-15',
      description: 'Premium Hosting Plan',
      items: [
        { name: 'Premium Hosting', quantity: 1, price: 29.99 }
      ]
    },
    {
      id: '2',
      number: 'INV-1233',
      amount: 79.99,
      status: 'paid',
      dueDate: '2023-11-15',
      paidDate: '2023-11-14',
      description: 'VPS Server Plan',
      items: [
        { name: 'VPS Server', quantity: 1, price: 79.99 }
      ]
    },
    {
      id: '3',
      number: 'INV-1232',
      amount: 199.99,
      status: 'overdue',
      dueDate: '2023-10-15',
      description: 'Dedicated Server Plan',
      items: [
        { name: 'Dedicated Server', quantity: 1, price: 199.99 }
      ]
    }
  ])

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      lastFour: '4242',
      brand: 'Visa',
      isDefault: true
    }
  ])

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false)
  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'card' as const,
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: '',
    isDefault: false
  })

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowPaymentModal(true)
  }

  const handlePayment = async () => {
    if (selectedInvoice) {
      // Simulate payment processing
      const processingToast = toast.loading('Processing payment...')
      
      try {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        setInvoices(prev => prev.map(inv => {
          if (inv.id === selectedInvoice.id) {
            return {
              ...inv,
              status: 'paid' as const,
              paidDate: new Date().toISOString().split('T')[0]
            }
          }
          return inv
        }))
        
        // Emit real-time update event
        window.dispatchEvent(new CustomEvent('dataUpdate', {
          detail: { type: 'invoice_paid', data: { amount: selectedInvoice.amount } }
        }))
        
        toast.success(`Invoice ${selectedInvoice.number} paid successfully!`, { id: processingToast })
        setShowPaymentModal(false)
        setSelectedInvoice(null)
      } catch (error) {
        toast.error('Payment failed. Please try again.', { id: processingToast })
      }
    }
  }

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Simulate PDF download
    const invoiceData = {
      number: invoice.number,
      amount: invoice.amount,
      date: invoice.dueDate,
      status: invoice.status
    }
    const dataStr = JSON.stringify(invoiceData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${invoice.number}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Invoice ${invoice.number} downloaded successfully!`)
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceDetailModal(true)
  }

  const handleAddPaymentMethod = async () => {
    // Enhanced validation
    if (!newPaymentMethod.cardNumber.trim()) {
      toast.error('Please enter a card number')
      return
    }

    if (!newPaymentMethod.name.trim()) {
      toast.error('Please enter the name on card')
      return
    }

    if (!newPaymentMethod.expiryMonth || !newPaymentMethod.expiryYear) {
      toast.error('Please select expiry date')
      return
    }

    if (!newPaymentMethod.cvv.trim()) {
      toast.error('Please enter CVV')
      return
    }

    // Card number validation
    const cardNumber = newPaymentMethod.cardNumber.replace(/\s/g, '')
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      toast.error('Card number must be between 13 and 19 digits')
      return
    }

    if (!/^\d+$/.test(cardNumber)) {
      toast.error('Card number can only contain digits')
      return
    }

    if (newPaymentMethod.cvv.length < 3 || newPaymentMethod.cvv.length > 4) {
      toast.error('CVV must be 3 or 4 digits')
      return
    }

    if (!/^\d+$/.test(newPaymentMethod.cvv)) {
      toast.error('CVV can only contain digits')
      return
    }

    // Show loading state
    const loadingToast = toast.loading('Adding payment method...')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      const cardBrand = cardNumber.startsWith('4') ? 'Visa' : 
                      cardNumber.startsWith('5') ? 'Mastercard' : 
                      cardNumber.startsWith('3') ? 'American Express' : 'Card'

      const method: PaymentMethod = {
        id: Date.now().toString(),
        type: newPaymentMethod.type,
        lastFour: cardNumber.slice(-4),
        brand: cardBrand,
        isDefault: newPaymentMethod.isDefault
      }

      let updatedPaymentMethods = [...paymentMethods]

      if (newPaymentMethod.isDefault) {
        updatedPaymentMethods = updatedPaymentMethods.map(m => ({ ...m, isDefault: false }))
      }

      updatedPaymentMethods.push(method)
      setPaymentMethods(updatedPaymentMethods)
      
      toast.success('Payment method added successfully!', { id: loadingToast })
      setShowAddPaymentModal(false)
      setNewPaymentMethod({
        type: 'card',
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        name: '',
        isDefault: false
      })
    } catch (error) {
      toast.error('Failed to add payment method. Please try again.', { id: loadingToast })
    }
  }

  const handleRemovePaymentMethod = (id: string) => {
    const method = paymentMethods.find(m => m.id === id)
    if (method?.isDefault) {
      toast.error('Cannot remove default payment method')
      return
    }

    setPaymentMethods(prev => prev.filter(m => m.id !== id))
    toast.success('Payment method removed')
  }

  const handleSetDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(m => ({ 
      ...m, 
      isDefault: m.id === id 
    })))
    toast.success('Default payment method updated')
  }

  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
  const totalPending = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0)
  const totalOverdue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
        <button 
          onClick={() => setShowPaymentMethodsModal(true)}
          className="btn-primary flex items-center space-x-2 group hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <CreditCard className="h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
          <span>Manage Payment Methods</span>
        </button>
      </div>

      {/* Billing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">${totalOverdue.toFixed(2)}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Avg</p>
              <p className="text-2xl font-bold text-blue-600">
                ${(invoices.reduce((sum, inv) => sum + inv.amount, 0) / Math.max(invoices.length, 1)).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h2>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {method.brand} •••• {method.lastFour}
                  </p>
                  <p className="text-sm text-gray-500">Default payment method</p>
                </div>
              </div>
              <button className="btn-secondary text-sm">Edit</button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
          <button className="btn-secondary text-sm">View All</button>
        </div>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Invoice #{invoice.number}</h3>
                  <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">{invoice.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)} group-hover:scale-105 transition-transform`}>
                  {invoice.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900">{invoice.number}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{invoice.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                    {invoice.paidDate && (
                      <span>Paid: {new Date(invoice.paidDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${invoice.amount}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {invoice.status === 'pending' && (
                      <button 
                        onClick={() => handlePayInvoice(invoice)}
                        className="btn-primary text-sm group hover:shadow-md transform hover:scale-105 transition-all duration-200"
                      >
                        <span className="flex items-center space-x-1">
                          <span>Pay Now</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">💳</span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Payment</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Invoice</p>
                <p className="font-medium">{selectedInvoice.number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-medium text-lg">${selectedInvoice.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium">Visa •••• 4242</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                className="btn-primary"
              >
                Pay ${selectedInvoice.amount}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {showPaymentMethodsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {method.brand} •••• {method.lastFour}
                        </p>
                        <p className="text-sm text-gray-500">
                          {method.type === 'card' ? 'Credit Card' : 'Bank Account'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Default
                        </span>
                      )}
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefaultPaymentMethod(method.id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setShowAddPaymentModal(true)}
                className="w-full btn-secondary"
              >
                Add New Payment Method
              </button>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPaymentMethodsModal(false)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showInvoiceDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Details - {selectedInvoice.number}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Invoice Number</p>
                  <p className="text-lg font-semibold">{selectedInvoice.number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Due Date</p>
                  <p className="text-lg font-semibold">{selectedInvoice.dueDate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Amount</p>
                  <p className="text-lg font-semibold">${selectedInvoice.amount}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                <p className="text-gray-600">{selectedInvoice.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Billing Period</p>
                <p className="text-gray-600">
                  {selectedInvoice.dueDate} - {new Date(new Date(selectedInvoice.dueDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => handleDownloadInvoice(selectedInvoice)}
                className="btn-secondary"
              >
                Download
              </button>
              {selectedInvoice.status === 'pending' && (
                <button
                  onClick={() => {
                    setShowInvoiceDetailModal(false)
                    handlePayInvoice(selectedInvoice)
                  }}
                  className="btn-primary"
                >
                  Pay Now
                </button>
              )}
              <button
                onClick={() => setShowInvoiceDetailModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Payment Method</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                <input
                  type="text"
                  value={newPaymentMethod.cardNumber}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="4242 4242 4242 4242"
                  maxLength={16}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Month</label>
                  <select
                    value={newPaymentMethod.expiryMonth}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiryMonth: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">MM</option>
                    <option value="01">01</option>
                    <option value="02">02</option>
                    <option value="03">03</option>
                    <option value="04">04</option>
                    <option value="05">05</option>
                    <option value="06">06</option>
                    <option value="07">07</option>
                    <option value="08">08</option>
                    <option value="09">09</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Year</label>
                  <select
                    value={newPaymentMethod.expiryYear}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiryYear: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">YY</option>
                    <option value="24">24</option>
                    <option value="25">25</option>
                    <option value="26">26</option>
                    <option value="27">27</option>
                    <option value="28">28</option>
                    <option value="29">29</option>
                    <option value="30">30</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input
                  type="text"
                  value={newPaymentMethod.cvv}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cvv: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="123"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                <input
                  type="text"
                  value={newPaymentMethod.name}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="John Doe"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="default"
                  checked={newPaymentMethod.isDefault}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="default" className="ml-2 block text-sm text-gray-900">
                  Set as default payment method
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPaymentMethod}
                className="btn-primary"
              >
                Add Payment Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
