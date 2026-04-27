'use client'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [config, setConfig]     = useState(null)
  const [prices, setPrices]     = useState({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [newService, setNewService] = useState({ name: '', price: '' })
  const [showAdd, setShowAdd]   = useState(false)
  const [editKey, setEditKey]   = useState(null)
  const [editPrice, setEditPrice] = useState('')

  useEffect(() => { fetchConfig() }, [])

  const fetchConfig = async () => {
    const res  = await fetch('/api/setup')
    const data = await res.json()
    setConfig(data.config)
    setPrices(data.config?.prices || {})
    setLoading(false)
  }

  const saveServices = async (updatedPrices) => {
    setSaving(true)
    await fetch('/api/setup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        businessName: config.businessName,
        ownerName:    config.ownerName,
        phone:        config.phone,
        type:         config.type,
        prices:       updatedPrices,
      })
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    fetchConfig()
  }

  const handleAddService = async () => {
    if (!newService.name.trim() || !newService.price) return
    const key = newService.name.toLowerCase().replace(/\s+/g, '_')
    const updated = { ...prices, [key]: newService.price }
    setPrices(updated)
    setNewService({ name: '', price: '' })
    setShowAdd(false)
    await saveServices(updated)
  }

  const handleEditSave = async (key) => {
    const updated = { ...prices, [key]: editPrice }
    setPrices(updated)
    setEditKey(null)
    await saveServices(updated)
  }

  const handleDelete = async (key) => {
    if (!confirm('Is service ko delete karna chahte ho?')) return
    const updated = { ...prices }
    delete updated[key]
    setPrices(updated)
    await saveServices(updated)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your services and prices</p>
        </div>
        {saved && (
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
            ✅ Saved successfully!
          </div>
        )}
      </div>

      {/* Business info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Business Info</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Business name', value: config?.businessName },
            { label: 'Owner name',    value: config?.ownerName    },
            { label: 'Phone',         value: config?.phone        },
            { label: 'Business type', value: config?.type?.toUpperCase() },
          ].map(f => (
            <div key={f.label}>
              <p className="text-xs font-medium text-gray-400 mb-1">{f.label}</p>
              <p className="text-sm font-semibold text-gray-800">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services manager */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Services & Prices</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add, edit or delete your services</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700"
          >
            + Add Service
          </button>
        </div>

        {/* Add new service form */}
        {showAdd && (
          <div className="px-6 py-4 bg-green-50 border-b border-green-100">
            <p className="text-sm font-medium text-gray-700 mb-3">New service</p>
            <div className="flex gap-3">
              <input
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500"
                placeholder="Service name (e.g. Colour Print)"
                value={newService.name}
                onChange={e => setNewService({ ...newService, name: e.target.value })}
              />
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-green-500">
                <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">₹</span>
                <input
                  type="number"
                  className="px-3 py-2.5 text-sm outline-none w-24"
                  placeholder="Price"
                  value={newService.price}
                  onChange={e => setNewService({ ...newService, price: e.target.value })}
                />
              </div>
              <button
                onClick={handleAddService}
                disabled={saving}
                className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Services list */}
        <div className="divide-y divide-gray-100">
          {Object.keys(prices).length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No services yet — add one!</p>
            </div>
          ) : (
            Object.entries(prices).map(([key, price]) => (
              <div key={key} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Key: {key}</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Edit mode */}
                  {editKey === key ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-green-300 rounded-lg overflow-hidden">
                        <span className="px-2 py-1.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">₹</span>
                        <input
                          type="number"
                          className="px-2 py-1.5 text-sm outline-none w-20"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => handleEditSave(key)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditKey(null)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-base font-bold text-green-700">₹{price}</span>
                      <button
                        onClick={() => { setEditKey(key); setEditPrice(price) }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(key)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}