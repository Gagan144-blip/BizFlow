import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-green-600 mb-4">BizFlow</h1>
          <p className="text-xl text-gray-600 mb-2">Smart Automation for Every Business</p>
          <p className="text-gray-400 text-sm">Cyber Cafes · Retail Stores · Medical Clinics</p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {[
            { title: 'Customer Management', desc: 'Track every customer and their service history', icon: '👥' },
            { title: 'Auto Billing',         desc: 'Generate bills automatically based on services', icon: '🧾' },
            { title: 'Smart Dashboard',      desc: 'Real-time earnings and pending work overview', icon: '📊' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-medium text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-sm"
          >
            Sign In →
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-white transition-all"
          >
            Create Account
          </Link>
        </div>

      </div>
    </div>
  )
}