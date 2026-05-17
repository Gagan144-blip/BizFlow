import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ── PUT /api/customers/[id] ──────────────────────────────────────────────────
// FIX: new endpoint — edit an existing customer's details
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ success: false }, { status: 401 });

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    const adminId = parseInt(session.user.id);
    const body = await req.json();

    // Security: verify this customer belongs to this admin
    const existing = await prisma.customer.findFirst({
      where: { id, adminId },
    });
    if (!existing)
      return Response.json(
        { success: false, error: "Customer not found" },
        { status: 404 },
      );

    // Validate phone format
    if (body.phone && !/^\d{10}$/.test(body.phone.replace(/\s/g, ""))) {
      return Response.json(
        { success: false, error: "Invalid phone number" },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name.trim(),
        phone: body.phone.trim(),
        address: body.address?.trim() || "",
      },
    });
    return Response.json({ success: true, customer });
  } catch (err) {
    // Handle unique constraint violation (duplicate phone)
    if (err.code === "P2002") {
      return Response.json(
        {
          success: false,
          error: "Phone number already belongs to another customer",
        },
        { status: 409 },
      );
    }
    return Response.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

// ── DELETE /api/customers/[id] ───────────────────────────────────────────────
// FIX: added adminId security check — was missing before!
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ success: false }, { status: 401 });

    const { id: rawId } = await params;
    const id = parseInt(rawId);
    const adminId = parseInt(session.user.id);

    // FIX: verify this customer belongs to this admin before deleting
    const customer = await prisma.customer.findFirst({
      where: { id, adminId },
    });
    if (!customer)
      return Response.json(
        { success: false, error: "Customer not found" },
        { status: 404 },
      );

    // Unlink services from bills first (because of FK constraint)
    await prisma.service.updateMany({
      where: { customerId: id },
      data: { billId: null },
    });

    // Schema has onDelete: Cascade on both Customer→Service and Customer→Bill,
    // so deleting the customer cascades to their services and bills automatically.
    await prisma.customer.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
