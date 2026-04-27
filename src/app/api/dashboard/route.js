import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return Response.json({ error: 'Not logged in' }, { status: 401 })

    const adminId = parseInt(session.user.id)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Last 7 days ke liye dates banao
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      date.setHours(0, 0, 0, 0)
      return date
    })

    const [
      config,
      totalCustomers,
      todayCustomers,
      todayBills,
      totalBills,
      pendingServices,
      todayServicesCount,
      allServices,
    ] = await Promise.all([
      prisma.businessConfig.findUnique({ where: { adminId } }),
      prisma.customer.count({ where: { adminId } }),
      prisma.customer.count({ where: { adminId, createdAt: { gte: today } } }),
      prisma.bill.findMany({ where: { adminId, createdAt: { gte: today } } }),
      prisma.bill.findMany({ where: { adminId } }),
      prisma.service.findMany({
        where:   { adminId, status: 'pending' },
        include: { customer: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.service.count({ where: { adminId, createdAt: { gte: today } } }),
      prisma.service.findMany({ where: { adminId } }),
    ])

    // Weekly earnings data
    const weeklyEarnings = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)
        const bills = await prisma.bill.findMany({
          where: {
            adminId,
            createdAt: { gte: date, lt: nextDay }
          }
        })
        return {
          day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
          earnings: bills.reduce((sum, b) => sum + b.total, 0)
        }
      })
    )

    // Service type breakdown
    const serviceBreakdown = allServices.reduce((acc, s) => {
      const type = s.type.replace(/_/g, ' ').toUpperCase()
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const serviceChartData = Object.entries(serviceBreakdown).map(([name, value]) => ({
      name, value
    }))

    const todayEarnings = todayBills.reduce((sum, b) => sum + b.total, 0)
    const totalEarnings = totalBills.reduce((sum, b) => sum + b.total, 0)

    return Response.json({
      config,
      stats: {
        totalCustomers,
        todayCustomers,
        todayEarnings,
        totalEarnings,
        pendingCount:      pendingServices.length,
        todayServices:     todayServicesCount,
        totalBills:        totalBills.length,
      },
      pendingServices,
      weeklyEarnings,
      serviceChartData,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}