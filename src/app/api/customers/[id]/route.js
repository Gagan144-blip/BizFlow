import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return Response.json({ success: false }, { status: 401 })

    const { id : rawId } = await params
    const id = parseInt(rawId)

    console.log('Deleting customer id:', id)
  

    // Pehle bills delete karo
    await prisma.bill.deleteMany({
      where: { customerId: id }
    })

    // Phir services delete karo
    await prisma.service.deleteMany({
      where: { customerId: id }
    })

    // Phir customer delete karo
    await prisma.customer.delete({
      where: { id }
    })

    return Response.json({ success: true })
  } catch (err) {
    console.log('Delete error:', err.message)
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}