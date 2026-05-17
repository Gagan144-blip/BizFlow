// ── AUTOMATION 5: One-click CSV Export ──────────────────────────────────────
// GET /api/export?type=customers | services | bills
// Returns a .csv file the browser downloads automatically — no libraries needed.

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Safely wrap a cell value — escapes quotes, wraps in double-quotes
const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const adminId         = parseInt(session.user.id)
  const { searchParams } = new URL(req.url)
  const type            = searchParams.get('type')   // customers | services | bills

  let csv      = ''
  let filename = 'export.csv'

  // ── Customers CSV ──────────────────────────────────────────────────────────
  if (type === 'customers') {
    const rows = await prisma.customer.findMany({
      where:   { adminId, isDeleted: false, NOT: { phone: '0000000000' } },
      include: { _count: { select: { services: true, bills: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const headers = ['Name', 'Phone', 'Address', 'Total Services', 'Total Bills', 'Joined On']
    csv = headers.map(cell).join(',') + '\n'
    csv += rows.map(r => [
      cell(r.name),
      cell(r.phone),
      cell(r.address || ''),
      cell(r._count.services),
      cell(r._count.bills),
      cell(new Date(r.createdAt).toLocaleDateString('en-IN')),
    ].join(',')).join('\n')

    filename = `customers-${Date.now()}.csv`
  }

  // ── Services CSV ───────────────────────────────────────────────────────────
  else if (type === 'services') {
    const rows = await prisma.service.findMany({
      where:   { adminId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    })

    const headers = ['Customer', 'Phone', 'Service', 'Quantity', 'Price (₹)', 'Status', 'Billed?', 'Date']
    csv = headers.map(cell).join(',') + '\n'
    csv += rows.map(r => [
      cell(r.customer.phone === '0000000000' ? 'Walk-in' : r.customer.name),
      cell(r.customer.phone === '0000000000' ? '—'       : r.customer.phone),
      cell(r.type.replace(/_/g, ' ').toUpperCase()),
      cell(r.quantity),
      cell(r.price),
      cell(r.status),
      cell(r.billId ? 'Yes' : 'No'),
      cell(new Date(r.createdAt).toLocaleDateString('en-IN')),
    ].join(',')).join('\n')

    filename = `services-${Date.now()}.csv`
  }

  // ── Bills CSV ──────────────────────────────────────────────────────────────
  else if (type === 'bills') {
    const rows = await prisma.bill.findMany({
      where:   { adminId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    })

    const headers = ['Invoice No', 'Customer', 'Phone', 'Subtotal (₹)', 'GST %', 'GST (₹)', 'Total (₹)', 'Paid?', 'Payment Method', 'Date']
    csv = headers.map(cell).join(',') + '\n'
    csv += rows.map(r => [
      cell(r.invoiceNo || '—'),
      cell(r.customer?.name  || '—'),
      cell(r.customer?.phone || '—'),
      cell(r.subtotal),
      cell(r.gstRate  > 0 ? `${r.gstRate}%` : '—'),
      cell(r.gstAmount > 0 ? r.gstAmount : '—'),
      cell(r.total),
      cell(r.isPaid ? 'Yes' : 'No'),
      cell(r.paymentMethod || '—'),
      cell(new Date(r.createdAt).toLocaleDateString('en-IN')),
    ].join(',')).join('\n')

    filename = `bills-${Date.now()}.csv`
  }

  // ── Unknown type ───────────────────────────────────────────────────────────
  else {
    return new Response('Invalid type. Use: customers | services | bills', { status: 400 })
  }

  return new Response(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
