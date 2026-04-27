'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import BillPDF from '@/components/BillPDF'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
)

export default function BillingPage() {
  const [customers, setCustomers]               = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [services, setServices]                 = useState([])
  const [bill, setBill]                         = useState(null)
  const [loading, setLoading]                   = useState(false)
  const [bills, setBills]                       = useState([])
  const [config, setConfig]                     = useState(null)
  const [whatsappLoading, setWhatsappLoading]   = useState(false)
  const [whatsappSent, setWhatsappSent]         = useState(false)

  useEffect(() => {
    fetchCustomers()
    fetchBills()
    fetchConfig()
  }, [])

  const fetchCustomers = async () => {
    const res  = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(data.customers)
  }

  const fetchBills = async () => {
    const res  = await fetch('/api/bills')
    const data = await res.json()
    setBills(data.bills)
  }

  const fetchConfig = async () => {
    const res  = await fetch('/api/setup')
    const data = await res.json()
    setConfig(data.config)
  }

  const handleCustomerSelect = async (customerId) => {
    if (!customerId) { setSelectedCustomer(null); setServices([]); setBill(null); return }
    const customer = customers.find(c => c.id === parseInt(customerId))
    setSelectedCustomer(customer)
    setBill(null)
    const res  = await fetch(`/api/services?customerId=${customerId}`)
    const data = await res.json()
    setServices(data.services)
  }

  const generateBill = async () => {
    if (!selectedCustomer) return
    setLoading(true)
    const res  = await fetch('/api/bills', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ customerId: selectedCustomer.id })
    })
    const data = await res.json()
    if (data.success) { setBill(data); fetchBills() }
    setLoading(false)
  }

  const sendWhatsApp = async () => {
  if (!selectedCustomer?.phone) return
  setWhatsappLoading(true)
  const res  = await fetch('/api/whatsapp', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      phone:        selectedCustomer.phone,
      customerName: selectedCustomer.name,
      businessName: config?.businessName,
      services:     services,
      total:        total,
    })
  })
  const data = await res.json()
  if (data.success) setWhatsappSent(true)
  setWhatsappLoading(false)
}

  const total       = services.reduce((sum, s) => sum + s.price, 0)
  const totalBilled = bills.reduce((sum, b) => sum + b.total, 0)

  const statusColor = (s) => {
    if (s === 'pending')     return 'bg-yellow-100 text-yellow-800'
    if (s === 'in-progress') return 'bg-blue-100 text-blue-800'
    if (s === 'completed')   return 'bg-green-100 text-green-800'
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
        <p className="text-gray-500 text-sm mt-1">Generate and manage customer bills</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total bills',    value: bills.length,      color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
          { label: 'Total revenue',  value: `₹${totalBilled}`, color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200'  },
          { label: 'Avg bill value', value: bills.length > 0 ? `₹${Math.round(totalBilled / bills.length)}` : '₹0', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 border ${s.border}`}>
            <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-sm font-medium text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Left — Generate Bill */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Generate Bill</h2>

          {/* Customer select */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Select customer</label>
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white"
              onChange={e => handleCustomerSelect(e.target.value)}
            >
              <option value="">Choose customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>

          {/* Services breakdown */}
          {selectedCustomer && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{selectedCustomer.name}</div>
                    <div className="text-xs text-gray-400">{selectedCustomer.phone}</div>
                  </div>
                </div>
              </div>

              {services.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400 text-sm">No services found for this customer</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {services.map(s => (
                      <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            {s.type.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">Qty: {s.quantity}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(s.status)}`}>
                            {s.status}
                          </span>
                          <span className="text-sm font-bold text-green-700">₹{s.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <span className="font-bold text-gray-800">Total Amount</span>
                    <span className="text-2xl font-bold text-green-600">₹{total}</span>
                  </div>

                  {/* Generate + PDF buttons */}
                  {!bill ? (
                    <div className="px-5 py-4">
                      <button
                        onClick={generateBill}
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
                      >
                        {loading ? 'Generating...' : '🧾 Generate & Save Bill'}
                      </button>
                      {/* WhatsApp button */}
                      <button
                        onClick={sendWhatsApp}
                        disabled={whatsappLoading || whatsappSent}
                        className="w-full py-3 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 disabled:opacity-50 transition-all"
                      >
                        {whatsappSent
                          ? '✅ WhatsApp Sent!'
                          : whatsappLoading
                          ? 'Sending...'
                          : '📱 Send Bill on WhatsApp'
                        }
                      </button>
                    </div>
                  ) : (
                    <div className="px-5 py-4 space-y-3">
                      <div className="w-full py-3 bg-green-50 border border-green-200 rounded-xl text-center">
                        <p className="text-green-700 font-bold text-sm">✅ Bill Generated!</p>
                        <p className="text-green-600 text-xs mt-1">Total ₹{bill.total} saved successfully</p>
                      </div>

                      {/* PDF Download */}
                      {config && (
                        <PDFDownloadLink
                          document={
                            <BillPDF
                              config={config}
                              customer={selectedCustomer}
                              services={services}
                              billNumber={bills.length}
                            />
                          }
                          fileName={`bill-${selectedCustomer?.name}-${Date.now()}.pdf`}
                        >
                          {({ loading: pdfLoading }) => (
                            <button className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
                              {pdfLoading ? 'Preparing PDF...' : '📄 Download PDF Bill'}
                            </button>
                          )}
                        </PDFDownloadLink>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right — Past Bills */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Bill History</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {bills.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">🧾</div>
                <p className="text-gray-500 font-medium">No bills yet</p>
                <p className="text-gray-400 text-sm mt-1">Generate your first bill</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Bill #', 'Amount', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bills.map((b, i) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-gray-700">#{bills.length - i}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-green-700">₹{b.total}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {new Date(b.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}