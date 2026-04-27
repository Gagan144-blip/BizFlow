import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ services: [] })

  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')

  const where = {
    adminId: parseInt(session.user.id),
    ...(customerId ? { customerId: parseInt(customerId) } : {})
  }

  const services = await prisma.service.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  })
  return Response.json({ services })
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return Response.json({ success: false }, { status: 401 })

    const body = await req.json()
    const service = await prisma.service.create({
      data: {
        adminId:    parseInt(session.user.id),
        customerId: parseInt(body.customerId),
        type:       body.type,
        quantity:   parseInt(body.quantity),
        price:      parseFloat(body.price),
        status:     'pending'
      }
    })
    return Response.json({ success: true, service })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return Response.json({ success: false }, { status: 401 })

    const body = await req.json()
    const service = await prisma.service.update({
      where: { id: body.id },
      data:  { status: body.status }
    })
    return Response.json({ success: true, service })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}