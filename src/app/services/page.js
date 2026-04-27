'use client'
import { useState, useEffect } from 'react'

export default function ServicesPage() {
  const [services, setServices]     = useState([])
  const [customers, setCustomers]   = useState([])
  const [config, setConfig]         = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate]     = useState('all')
  const [searchQuery, setSearchQuery]   = useState('')
  const [form, setForm] = useState({
    customerId: '',
    type:       '',
    quantity:   1,
    price:      0
  })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [s, c, cfg] = await Promise.all([
      fetch('/api/services').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/setup').then(r => r.json()),
    ])
    setServices(s.services)
    setCustomers(c.customers)
    setConfig(cfg.config)
  }

  const getServiceTypes = () => {
    if (!config) return []
    const prices = config.prices
    return Object.keys(prices).map(key => ({
      key,
      label: key.replace(/_/g, ' ').toUpperCase(),
      price: parseFloat(prices[key])
    }))
  }

  const handleTypeChange = (type) => {
    const selected = getServiceTypes().find(s => s.key === type)
    setForm(prev => ({
      ...prev,
      type,
      price: selected ? selected.price * prev.quantity : 0
    }))
  }

  const handleQuantityChange = (qty) => {
    const selected = getServiceTypes().find(s => s.key === form.type)
    setForm(prev => ({
      ...prev,
      quantity: parseInt(qty),
      price: selected ? selected.price * parseInt(qty) : 0
    }))
  }

  const handleWalkIn = () => {
    const walkIn = customers.find(c => c.phone === '0000000000')
    if (walkIn) {
      setForm(prev => ({ ...prev, customerId: walkIn.id }))
      setShowForm(true)
    }
  }

  const handleSubmit = async () => {
    if (!form.customerId || !form.type) return
    setLoading(true)
    const res  = await fetch('/api/services', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form)
    })
    const data = await res.json()
    if (data.success) {
      setShowForm(false)
      setForm({ customerId: '', type: '', quantity: 1, price: 0 })
      fetchAll()
    }
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    await fetch('/api/services', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, status })
    })
    fetchAll()
  }

  const statusColor = (s) => {
    if (s === 'pending')     return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    if (s === 'in-progress') return 'bg-blue-100 text-blue-800 border border-blue-200'
    if (s === 'completed')   return 'bg-green-100 text-green-800 border border-green-200'
  }

  // Filter logic
  const filteredServices = services.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    if (searchQuery && !s.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterDate === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (new Date(s.createdAt) < today) return false
    }
    if (filterDate === 'week') {
      const week = new Date()
      week.setDate(week.getDate() - 7)
      if (new Date(s.createdAt) < week) return false
    }
    if (filterDate === 'month') {
      const month = new Date()
      month.setMonth(month.getMonth() - 1)
      if (new Date(s.createdAt) < month) return false
    }
    return true
  })

  const pendingCount   = services.filter(s => s.status === 'pending').length
  const completedCount = services.filter(s => s.status === 'completed').length
  const totalRevenue   = services.reduce((sum, s) => sum + s.price, 0)
  const regularCustomers = customers.filter(c => c.phone !== '0000000000')

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Services</h1>
          <p className="text-gray-500 text-sm mt-1">{services.length} total services</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleWalkIn}
            className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all shadow-sm"
          >
            ⚡ Walk-in Customer
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all shadow-sm"
          >
            + Add Service
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending',   value: pendingCount,       color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: 'Completed', value: completedCount,     color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200'  },
          { label: 'Revenue',   value: `₹${totalRevenue}`, color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 border ${s.border}`}>
            <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-sm font-medium text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Service Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">New Service</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Select customer</label>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white"
                value={form.customerId}
                onChange={e => setForm({ ...form, customerId: e.target.value })}
              >
                <option value="">Choose customer...</option>
                <option value={customers.find(c => c.phone === '0000000000')?.id}>
                  ⚡ Walk-in Customer
                </option>
                {regularCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Service type</label>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white"
                value={form.type}
                onChange={e => handleTypeChange(e.target.value)}
              >
                <option value="">Choose service...</option>
                {getServiceTypes().map(s => (
                  <option key={s.key} value={s.key}>{s.label} — ₹{s.price}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Quantity</label>
              <input
                type="number"
                min="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                value={form.quantity}
                onChange={e => handleQuantityChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Total price (auto)</label>
              <div className="w-full px-4 py-3 border border-green-200 rounded-xl text-sm bg-green-50 text-green-700 font-bold">
                ₹{form.price}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setForm({ customerId: '', type: '', quantity: 1, price: 0 }) }}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Service'}
            </button>
          </div>
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center gap-4 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500"
            placeholder="Search by customer name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          <div className="flex gap-1">
            {[
              { value: 'all',         label: 'All'         },
              { value: 'pending',     label: 'Pending'     },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed',   label: 'Completed'   },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${filterStatus === f.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Date:</span>
          <div className="flex gap-1">
            {[
              { value: 'all',   label: 'All time'   },
              { value: 'today', label: 'Today'      },
              { value: 'week',  label: 'This week'  },
              { value: 'month', label: 'This month' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterDate(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${filterDate === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="ml-auto">
          <span className="text-xs text-gray-400">
            {filteredServices.length} of {services.length} services
          </span>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Customer', 'Service', 'Qty', 'Price', 'Status', 'Update', 'Date'].map(h => (
                <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-16 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-gray-500 font-medium">No services found</p>
                  <p className="text-gray-400 text-sm mt-1">Try changing filters</p>
                </td>
              </tr>
            ) : (
              filteredServices.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0
                        ${s.customer.phone === '0000000000' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {s.customer.phone === '0000000000' ? '⚡' : s.customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">
                          {s.customer.phone === '0000000000' ? 'Walk-in' : s.customer.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {s.customer.phone === '0000000000' ? 'Quick service' : s.customer.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    {s.type.replace(/_/g, ' ').toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.quantity}</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-700">₹{s.price}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${statusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white cursor-pointer"
                      value={s.status}
                      onChange={e => updateStatus(s.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {new Date(s.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}