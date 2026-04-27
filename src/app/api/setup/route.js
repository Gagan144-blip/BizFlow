import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const defaultPrices = {
  cyber: {
    print_bw:       '2',
    print_color:    '10',
    scan:           '5',
    lamination:     '15',
    photocopy:      '1',
    internet:       '30',
    typing:         '20',
    passport_photo: '50',
  },
  retail: {
    product_sale:  '100',
    home_delivery: '50',
    gift_wrap:     '30',
    bulk_discount: '10',
    packaging:     '20',
    installation:  '200',
  },
  medical: {
    consultation: '200',
    followup:     '100',
    blood_test:   '300',
    xray:         '500',
    dressing:     '150',
    medicine:     '50',
    injection:    '100',
    ecg:          '400',
  },
}

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ config: null })

  const config = await prisma.businessConfig.findUnique({
    where: { adminId: parseInt(session.user.id) }
  })

  if (!config) return Response.json({ config: null })

  const prices = config.prices && Object.keys(config.prices).length > 0
    ? config.prices
    : defaultPrices[config.type] || {}

  return Response.json({ config: { ...config, prices } })
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return Response.json({ success: false, error: 'Not logged in' }, { status: 401 })

    const body   = await req.json()
    const config = await prisma.businessConfig.upsert({
      where:  { adminId: parseInt(session.user.id) },
      update: {
        businessName: body.businessName,
        ownerName:    body.ownerName,
        phone:        body.phone,
        type:         body.type,
        prices:       body.prices,
      },
      create: {
        adminId:      parseInt(session.user.id),
        businessName: body.businessName,
        ownerName:    body.ownerName,
        phone:        body.phone,
        type:         body.type,
        prices:       body.prices,
      }
    })
       // Setup complete hone ke baad Walk-in customer auto-create karo
    await prisma.customer.upsert({
      where: {
        phone_adminId: {
          phone:   '0000000000',
          adminId: parseInt(session.user.id)
        }
      },
      update: {},
      create: {
        adminId: parseInt(session.user.id),
        name:    'Walk-in Customer',
        phone:   '0000000000',
        address: 'Walk-in',
      }
    })
    return Response.json({ success: true, config })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
