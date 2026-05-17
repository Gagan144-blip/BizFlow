import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return Response.json({ error: "Not logged in" }, { status: 401 });

    const adminId = parseInt(session.user.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    // AUTOMATION 3: threshold for "overdue" — pending/in-progress > 24 hours
    const overdueThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      config,
      totalCustomers,
      todayCustomers,
      todayBills,
      totalBills,
      pendingServices,
      todayServicesCount,
      allServices,
      weekBills,
      // AUTOMATION 3: fetch overdue services in the same parallel batch
      overdueServices,
    ] = await Promise.all([
      prisma.businessConfig.findUnique({ where: { adminId } }),
      prisma.customer.count({ where: { adminId, isDeleted: false } }),
      prisma.customer.count({
        where: { adminId, isDeleted: false, createdAt: { gte: today } },
      }),
      prisma.bill.findMany({ where: { adminId, createdAt: { gte: today } } }),
      prisma.bill.findMany({ where: { adminId } }),
      prisma.service.findMany({
        where: { adminId, status: "pending" },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.service.count({ where: { adminId, createdAt: { gte: today } } }),
      prisma.service.findMany({ where: { adminId } }),
      prisma.bill.findMany({
        where: { adminId, createdAt: { gte: weekStart } },
      }),
      // Overdue = pending/in-progress AND older than 24 hours AND not yet billed
      prisma.service.findMany({
        where: {
          adminId,
          status: { in: ["pending", "in-progress"] },
          createdAt: { lt: overdueThreshold },
          billId: null,
        },
        include: { customer: true },
        orderBy: { createdAt: "asc" }, // oldest first
      }),
    ]);

    // Group weekly bills by day in JS — single query, no N+1
    const weeklyEarnings = last7Days.map((date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const dayBills = weekBills.filter((b) => {
        const d = new Date(b.createdAt);
        return d >= date && d < nextDay;
      });
      return {
        day: date.toLocaleDateString("en-IN", { weekday: "short" }),
        earnings: dayBills.reduce((sum, b) => sum + b.total, 0),
      };
    });

    const serviceBreakdown = allServices.reduce((acc, s) => {
      const type = s.type.replace(/_/g, " ").toUpperCase();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const serviceChartData = Object.entries(serviceBreakdown).map(
      ([name, value]) => ({ name, value }),
    );

    const todayEarnings = todayBills.reduce((sum, b) => sum + b.total, 0);
    const totalEarnings = totalBills.reduce((sum, b) => sum + b.total, 0);

    return Response.json({
      config,
      stats: {
        totalCustomers,
        todayCustomers,
        todayEarnings,
        totalEarnings,
        pendingCount: pendingServices.length,
        todayServices: todayServicesCount,
        totalBills: totalBills.length,
        overdueCount: overdueServices.length, // AUTOMATION 3
      },
      pendingServices,
      overdueServices, // AUTOMATION 3: full list for display
      weeklyEarnings,
      serviceChartData,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
