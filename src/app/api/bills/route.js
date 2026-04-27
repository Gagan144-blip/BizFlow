import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ bills: [] })

  const bills = await prisma.bill.findMany({
    where:   { adminId: parseInt(session.user.id) },
    orderBy: { createdAt: 'desc' }
  })
  return Response.json({ bills })
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return Response.json({ success: false }, { status: 401 })

    const body = await req.json()

    const services = await prisma.service.findMany({
      where: {
        customerId: parseInt(body.customerId),
        adminId:    parseInt(session.user.id)
      }
    })

    const total = services.reduce((sum, s) => sum + s.price, 0)

    const bill = await prisma.bill.create({
      data: {
        adminId:    parseInt(session.user.id),
        customerId: parseInt(body.customerId),
        total:      parseFloat(total),
      }
    })

    return Response.json({ success: true, bill, services, total })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}