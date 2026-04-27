'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#065f46']

export default function Dashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const router                = useRouter()

  useEffect(() => { checkSetup() }, [])

  const checkSetup = async () => {
    const res  = await fetch('/api/setup')
    const json = await res.json()
    if (!json.config) { router.push('/setup'); return }
    fetchDashboard()
  }

  const fetchDashboard = async () => {
    const res  = await fetch('/api/dashboard')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const { config, stats, pendingServices, weeklyEarnings, serviceChartData } = data

  const statusColor = (s) => {
    if (s === 'pending')     return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    if (s === 'in-progress') return 'bg-blue-100 text-blue-800 border border-blue-200'
    if (s === 'completed')   return 'bg-green-100 text-green-800 border border-green-200'
  }

  return (
    <div className="space-y-6">

      {/* Business header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <p className="text-green-100 text-sm font-medium mb-1">Welcome back 👋</p>
          <h1 className="text-3xl font-bold">{config?.businessName}</h1>
          <p className="text-green-100 mt-1">{config?.ownerName} · {config?.type?.toUpperCase()}</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-white bg-opacity-20 flex items-center justify-center text-3xl">
          {config?.type === 'cyber' ? '🖥️' : config?.type === 'retail' ? '🛒' : '🏥'}
        </div>
      </div>

      {/* Today's stats */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Today's summary</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Today's earnings", value: `₹${stats.todayEarnings}`, color: 'text-green-700',  bg: 'bg-green-100',  border: 'border-green-200',  icon: '💰' },
            { label: 'Pending works',    value: stats.pendingCount,         color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200', icon: '⏳' },
            { label: 'Customers today',  value: stats.todayCustomers,       color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-200',   icon: '👥' },
            { label: 'Services today',   value: stats.todayServices,        color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200', icon: '⚡' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl p-5 border ${s.border} shadow-sm`}>
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center text-xl mb-4`}>
                {s.icon}
              </div>
              <div className={`text-4xl font-bold ${s.color} mb-1`}>{s.value}</div>
              <div className="text-sm font-medium text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6">

        {/* Weekly earnings bar chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Weekly Earnings</h3>
          <p className="text-xs text-gray-400 mb-4">Last 7 day's Revenue</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyEarnings} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                formatter={(value) => [`₹${value}`, 'Earnings']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="earnings" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service breakdown pie chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Service Breakdown</h3>
          <p className="text-xs text-gray-400 mb-4">Most Frequently Used Service</p>
          {serviceChartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center">
              <p className="text-gray-400 text-sm">No services yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={serviceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {serviceChartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* All time + Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">All time</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total customers', value: stats.totalCustomers,      color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
              { label: 'Total bills',     value: stats.totalBills,          color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-100' },
              { label: 'Total earned',    value: `₹${stats.totalEarnings}`, color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-100'  },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-5 border ${s.border}`}>
                <div className={`text-4xl font-bold ${s.color} mb-2`}>{s.value}</div>
                <div className="text-sm font-medium text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Quick actions</p>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {[
              { href: '/customers', label: 'Add Customer',  icon: '👤', color: 'text-blue-600'   },
              { href: '/services',  label: 'Add Service',   icon: '⚡', color: 'text-purple-600' },
              { href: '/billing',   label: 'Generate Bill', icon: '🧾', color: 'text-green-600'  },
            ].map((a, i) => (
              <Link
                key={a.href}
                href={a.href}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${i !== 2 ? 'border-b border-gray-100' : ''}`}
              >
                <span className="text-lg">{a.icon}</span>
                <span className={`text-sm font-medium ${a.color}`}>{a.label}</span>
                <span className="ml-auto text-gray-300">›</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Pending works table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pending works</p>
          <Link href="/services" className="text-xs text-green-600 font-medium hover:underline">
            View all →
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {pendingServices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-gray-500 font-medium">Everything Is Done</p>
              <p className="text-gray-400 text-sm mt-1">No pending work for now</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Customer', 'Service', 'Qty', 'Price', 'Status'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingServices.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{s.customer.name}</div>
                      <div className="text-sm text-gray-400">{s.customer.phone}</div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}