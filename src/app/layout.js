import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import SessionWrapper from '@/components/SessionWrapper'

const geist = Geist({ subsets: ['latin'] })

export const metadata = {
  title: 'BizFlow',
  description: 'Business Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <SessionWrapper>
          <Sidebar />
          <div className="ml-56">
            <Navbar />
            <main className="p-10 min-h-screen bg-gray-50">
              {children}
            </main>
          </div>
        </SessionWrapper>
      </body>
    </html>
  )
}