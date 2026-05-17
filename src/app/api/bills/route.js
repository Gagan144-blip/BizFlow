import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ── GET /api/bills ───────────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ bills: [] });

  const bills = await prisma.bill.findMany({
    where: { adminId: parseInt(session.user.id) },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ bills });
}

// ── POST /api/bills ──────────────────────────────────────────────────────────
// AUTOMATION 1 — Auto-complete: all services in the bill become "completed"
// AUTOMATION 2 — Auto invoice number: INV-YYYY-XXXX generated automatically
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ success: false }, { status: 401 });

    const body = await req.json();
    const adminId = parseInt(session.user.id);
    const customerId = parseInt(body.customerId);

    // Only include services not yet billed (billId === null)
    const services = await prisma.service.findMany({
      where: { customerId, adminId, billId: null },
    });

    if (services.length === 0) {
      return Response.json(
        {
          success: false,
          error: "No unbilled services found for this customer.",
        },
        { status: 400 },
      );
    }

    const subtotal = parseFloat(
      services.reduce((s, r) => s + r.price, 0).toFixed(2),
    );
    const gstRate = parseFloat(body.gstRate || 0);
    const gstAmount = parseFloat(((subtotal * gstRate) / 100).toFixed(2));
    const total = parseFloat((subtotal + gstAmount).toFixed(2));

    // ── AUTOMATION 2: Generate unique invoice number ─────────────────────────
    // Count existing bills for this admin to get the next sequence number
    const billCount = await prisma.bill.count({ where: { adminId } });
    const year = new Date().getFullYear();
    const invoiceNo = `INV-${year}-${String(billCount + 1).padStart(4, "0")}`;
    // Result: INV-2025-0001, INV-2025-0002, …

    // Create bill record
    const bill = await prisma.bill.create({
      data: {
        adminId,
        customerId,
        subtotal,
        gstRate,
        gstAmount,
        total,
        invoiceNo, // ← stored automatically
        isPaid: false,
        paymentMethod: body.paymentMethod || null,
      },
    });

    // ── AUTOMATION 1: Auto-complete + mark billed in ONE query ───────────────
    // Services are linked to this bill AND flipped to "completed" automatically.
    // Owner no longer needs to manually update each service after billing.
    await prisma.service.updateMany({
      where: { id: { in: services.map((s) => s.id) } },
      data: { billId: bill.id, status: "completed" }, // ← auto-complete
    });

    return Response.json({
      success: true,
      bill,
      services,
      total,
      subtotal,
      gstAmount,
      gstRate,
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

// ── PATCH /api/bills ─────────────────────────────────────────────────────────
// Mark a bill as paid with payment method
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ success: false }, { status: 401 });

    const body = await req.json();
    const adminId = parseInt(session.user.id);

    const bill = await prisma.bill.update({
      where: { id: body.id, adminId },
      data: {
        isPaid: true,
        paymentMethod: body.paymentMethod || "cash",
        paidAt: new Date(),
      },
    });
    return Response.json({ success: true, bill });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
