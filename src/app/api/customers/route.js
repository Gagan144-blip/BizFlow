import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ customers: [] })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  const customers = await prisma.customer.findMany({
    where: {
      adminId: parseInt(session.user.id),
      OR: [
        { name:  { contains: search } },
        { phone: { contains: search } },
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: { services: true }
  })
  return Response.json({ customers })
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return Response.json({ success: false }, { status: 401 })

    const body = await req.json()
    const customer = await prisma.customer.create({
      data: {
        adminId:  parseInt(session.user.id),
        name:     body.name,
        phone:    body.phone,
        address:  body.address || '',
      }
    })
    return Response.json({ success: true, customer })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}