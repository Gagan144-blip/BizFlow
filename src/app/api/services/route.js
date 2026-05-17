import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ── GET /api/services ────────────────────────────────────────────────────────
// Supports: ?customerId=X  and  ?unbilled=true  (only show unbilled services)
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ services: [] });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const unbilled = searchParams.get("unbilled"); // FIX: filter unbilled only

  const where = {
    adminId: parseInt(session.user.id),
    ...(customerId ? { customerId: parseInt(customerId) } : {}),
    ...(unbilled === "true" ? { billId: null } : {}), // null = not yet billed
  };

  const services = await prisma.service.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ services });
}

// ── POST /api/services ───────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ success: false }, { status: 401 });

    const body = await req.json();
    const service = await prisma.service.create({
      data: {
        adminId: parseInt(session.user.id),
        customerId: parseInt(body.customerId),
        type: body.type,
        quantity: parseInt(body.quantity),
        price: parseFloat(body.price),
        status: "pending",
      },
    });
    return Response.json({ success: true, service });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

// ── PATCH /api/services ──────────────────────────────────────────────────────
// FIX: added adminId to where clause (security — was missing before!)
// FIX: now supports full edit (type, quantity, price) not just status
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ success: false }, { status: 401 });

    const body = await req.json();
    const adminId = parseInt(session.user.id);

    // Build update payload — only include fields that were sent
    const data = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.type !== undefined) data.type = body.type;
    if (body.quantity !== undefined) data.quantity = parseInt(body.quantity);
    if (body.price !== undefined) data.price = parseFloat(body.price);

    const service = await prisma.service.update({
      where: { id: body.id, adminId }, // FIX: adminId guard prevents editing another admin's services
      data,
    });
    return Response.json({ success: true, service });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

// ── DELETE /api/services?id=X ────────────────────────────────────────────────
// FIX: new endpoint — delete a single service (only unbilled ones)
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ success: false }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id"));
    const adminId = parseInt(session.user.id);

    // Safety: don't allow deleting a billed service (would break bill total)
    const existing = await prisma.service.findFirst({ where: { id, adminId } });
    if (!existing)
      return Response.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    if (existing.billId !== null) {
      return Response.json(
        {
          success: false,
          error: "Cannot delete a service that has already been billed.",
        },
        { status: 400 },
      );
    }

    await prisma.service.delete({ where: { id, adminId } });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
