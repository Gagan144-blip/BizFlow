'use client'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/services':  'Services',
  '/billing':   'Billing',
}

export default function Navbar() {
  const pathname          = usePathname()
  const { data: session } = useSession()

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/'
  if (isAuthPage) return null

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-medium text-gray-800">
          {pageTitles[pathname] || 'BizFlow'}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      {session?.user && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-medium">
            {session.user.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-gray-600">{session.user.name}</span>
        </div>
      )}
    </header>
  )
}