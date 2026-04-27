import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    const body = await req.json()

    // Check existing admin
    const existing = await prisma.admin.findUnique({
      where: { email: body.email }
    })
    if (existing) {
      return Response.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Password encrypt karo
    const hashedPassword = await bcrypt.hash(body.password, 10)

    // Admin save karo
    const admin = await prisma.admin.create({
      data: {
        name:     body.name,
        email:    body.email,
        password: hashedPassword,
      }
    })

    return Response.json({ success: true, admin: { id: admin.id, email: admin.email } })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}