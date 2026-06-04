import { Router } from "express";
import { prisma } from "../lib/prisma";

export const dashboardRouter = Router();

// ── GET /dashboard ────────────────────────────────────────────────────────────

dashboardRouter.get("/", async (_req, res, next) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [
      salesToday,
      totalCustomers,
      lowStockProducts,
      recentBills,
      topProducts,
      monthlySales,
      totalOutstandingBills,
      totalOutstandingPurchases,
    ] = await Promise.all([
      // Today's sales
      prisma.bill.aggregate({
        where: { date: { gte: today, lt: tomorrow } },
        _sum:   { grandTotal: true, paid: true },
        _count: { id: true },
      }),

      // Total customers
      prisma.customer.count(),

      // Low-stock products
      prisma.productBatch.findMany({
        orderBy: { qty: "asc" },
        take: 10,
      }).then((products) => products.filter((p) => p.qty <= p.minStock)),

      // Recent bills (last 5)
      prisma.bill.findMany({
        include: { items: true },
        orderBy: { date: "desc" },
        take: 5,
      }),

      // Top selling products by total quantity billed (last 30 days)
      prisma.billItem.groupBy({
        by: ["name"],
        where: {
          bill: {
            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        _sum:   { qty: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),

      // Monthly sales for last 6 months
      prisma.$queryRaw<Array<{ month: string; revenue: number; collected: number }>>`
        SELECT
          TO_CHAR(date, 'YYYY-MM') AS month,
          SUM("grandTotal")::float  AS revenue,
          SUM(paid)::float          AS collected
        FROM "Bill"
        WHERE date >= NOW() - INTERVAL '6 months'
        GROUP BY month
        ORDER BY month ASC
      `,

      // Total outstanding from customers
      prisma.customer.aggregate({ _sum: { totalCredit: true, totalPaid: true } }),

      // Total outstanding to suppliers
      prisma.purchase.aggregate({
        where: { status: "REMAINING" },
        _sum: { total: true, paid: true },
      }),
    ]);

    const customerOutstanding =
      (totalOutstandingBills._sum.totalCredit ?? 0) - (totalOutstandingBills._sum.totalPaid ?? 0);

    const supplierOutstanding =
      (totalOutstandingPurchases._sum.total ?? 0) - (totalOutstandingPurchases._sum.paid ?? 0);

    res.json({
      today: {
        sales:     salesToday._sum.grandTotal ?? 0,
        collected: salesToday._sum.paid       ?? 0,
        bills:     salesToday._count.id,
      },
      customers: totalCustomers,
      lowStockProducts,
      recentBills,
      topProducts,
      monthlySales,
      outstanding: {
        customers: customerOutstanding,
        suppliers: supplierOutstanding,
      },
    });
  } catch (err) {
    next(err);
  }
});
