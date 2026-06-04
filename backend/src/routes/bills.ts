import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { BillStatus } from "@prisma/client";

export const billRouter = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const billItemSchema = z.object({
  productId: z.number().int().positive(),
  batchId:   z.string(),
  name:      z.string(),
  price:     z.number().positive(),
  qty:       z.number().int().positive(),
  total:     z.number().positive(),
});

const createBillSchema = z.object({
  customerId:   z.number().int().positive().nullable().optional(),
  customerName: z.string().min(1),
  billType:     z.enum(["INVOICE", "CREDIT_MEMO", "DEBIT_MEMO"]).default("INVOICE"),
  items:        z.array(billItemSchema).min(1),
  subtotal:     z.number().nonnegative(),
  discount:     z.number().nonnegative().default(0),
  grandTotal:   z.number().nonnegative(),
  paid:         z.number().nonnegative().default(0),
  date:         z.string().datetime(),
  note:         z.string().optional(),
});

const addPaymentSchema = z.object({
  amount: z.number().positive(),
  date:   z.string().datetime(),
  note:   z.string().optional(),
});

// ── Helper: compute bill status ───────────────────────────────────────────────

function computeStatus(paid: number, grandTotal: number): BillStatus {
  if (paid >= grandTotal) return BillStatus.PAID;
  if (paid > 0)           return BillStatus.PARTIAL;
  return BillStatus.UNPAID;
}

// ── Helper: generate next Bill ID ─────────────────────────────────────────────

async function nextBillId(): Promise<string> {
  const last = await prisma.bill.findFirst({ orderBy: { id: "desc" } });
  if (!last) return "INV-001";
  const num = parseInt(last.id.split("-")[1] ?? "0", 10);
  return `INV-${String(num + 1).padStart(3, "0")}`;
}

// ── Helper: day sequence ──────────────────────────────────────────────────────

async function daySeqForDate(dateStr: string): Promise<number> {
  const start = new Date(dateStr);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const count = await prisma.bill.count({
    where: { date: { gte: start, lt: end } },
  });
  return count + 1;
}

// ── GET /bills ────────────────────────────────────────────────────────────────

billRouter.get("/", async (req, res, next) => {
  try {
    const { status, customerId, from, to, search } = req.query;

    const bills = await prisma.bill.findMany({
      where: {
        ...(status     ? { status: String(status) as BillStatus } : {}),
        ...(customerId ? { customerId: Number(customerId) }       : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(String(from)) } : {}),
                ...(to   ? { lte: new Date(String(to))   } : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { id:           { contains: String(search), mode: "insensitive" } },
                { customerName: { contains: String(search), mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { items: true, payments: true },
      orderBy: { date: "desc" },
    });
    res.json(bills);
  } catch (err) {
    next(err);
  }
});

// ── GET /bills/:id ────────────────────────────────────────────────────────────

billRouter.get("/:id", async (req, res, next) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.id },
      include: { items: true, payments: true, customer: true },
    });
    if (!bill) throw new AppError(404, "Bill not found");
    res.json(bill);
  } catch (err) {
    next(err);
  }
});

// ── POST /bills ───────────────────────────────────────────────────────────────

billRouter.post("/", async (req, res, next) => {
  try {
    const data = createBillSchema.parse(req.body);
    const id     = await nextBillId();
    const daySeq = await daySeqForDate(data.date);
    const status = computeStatus(data.paid, data.grandTotal);

    const bill = await prisma.$transaction(async (tx) => {
      // Deduct inventory for each item
      for (const item of data.items) {
        const product = await tx.productBatch.findUnique({ where: { id: item.productId } });
        if (!product) throw new AppError(404, `Product ${item.productId} not found`);
        if (product.qty < item.qty) {
          throw new AppError(400, `Insufficient stock for "${product.name}". Available: ${product.qty}`);
        }
        await tx.productBatch.update({
          where: { id: item.productId },
          data:  { qty: { decrement: item.qty } },
        });
      }

      // Create bill
      const newBill = await tx.bill.create({
        data: {
          id,
          customerId:   data.customerId ?? null,
          customerName: data.customerName,
          billType:     data.billType,
          subtotal:     data.subtotal,
          discount:     data.discount,
          grandTotal:   data.grandTotal,
          paid:         data.paid,
          status,
          date:         new Date(data.date),
          note:         data.note,
          daySeq,
          items:    { create: data.items },
          payments: data.paid > 0
            ? { create: [{ amount: data.paid, date: new Date(data.date) }] }
            : undefined,
        },
        include: { items: true, payments: true },
      });

      // Update customer ledger
      if (data.customerId) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            totalCredit: { increment: data.grandTotal },
            totalPaid:   { increment: data.paid },
          },
        });
      }

      return newBill;
    });

    res.status(201).json(bill);
  } catch (err) {
    next(err);
  }
});

// ── POST /bills/:id/payments ──────────────────────────────────────────────────

billRouter.post("/:id/payments", async (req, res, next) => {
  try {
    const { amount, date, note } = addPaymentSchema.parse(req.body);
    const billId = req.params.id;

    const updated = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new AppError(404, "Bill not found");

      const remaining = bill.grandTotal - bill.paid;
      if (amount > remaining + 0.001) {
        throw new AppError(400, `Payment ₹${amount} exceeds outstanding balance ₹${remaining.toFixed(2)}`);
      }

      const newPaid  = bill.paid + amount;
      const newStatus = computeStatus(newPaid, bill.grandTotal);

      const updatedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          paid:     newPaid,
          status:   newStatus,
          payments: { create: { amount, date: new Date(date), note } },
        },
        include: { items: true, payments: true },
      });

      if (bill.customerId) {
        await tx.customer.update({
          where: { id: bill.customerId },
          data:  { totalPaid: { increment: amount } },
        });
      }

      return updatedBill;
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── GET /bills/stats/summary ──────────────────────────────────────────────────

billRouter.get("/stats/summary", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter =
      from || to
        ? {
            date: {
              ...(from ? { gte: new Date(String(from)) } : {}),
              ...(to   ? { lte: new Date(String(to))   } : {}),
            },
          }
        : {};

    const [totals, byStatus] = await Promise.all([
      prisma.bill.aggregate({
        where: dateFilter,
        _sum: { grandTotal: true, paid: true, discount: true },
        _count: { id: true },
      }),
      prisma.bill.groupBy({
        by: ["status"],
        where: dateFilter,
        _count: { id: true },
        _sum: { grandTotal: true },
      }),
    ]);

    res.json({
      totalRevenue:    totals._sum.grandTotal ?? 0,
      totalCollected:  totals._sum.paid       ?? 0,
      totalDiscount:   totals._sum.discount   ?? 0,
      totalOutstanding: (totals._sum.grandTotal ?? 0) - (totals._sum.paid ?? 0),
      totalBills:      totals._count.id,
      byStatus,
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /bills/:id ─────────────────────────────────────────────────────────

billRouter.delete("/:id", async (req, res, next) => {
  try {
    const billId = req.params.id;

    await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({
        where: { id: billId },
        include: { items: true },
      });
      if (!bill) throw new AppError(404, "Bill not found");

      // Restore inventory stock for each item in the bill
      for (const item of bill.items) {
        if (item.productId) {
          const productExists = await tx.productBatch.findUnique({ where: { id: item.productId } });
          if (productExists) {
            await tx.productBatch.update({
              where: { id: item.productId },
              data: { qty: { increment: item.qty } },
            });
          }
        }
      }

      // Revert customer credit ledger
      if (bill.customerId) {
        const customerExists = await tx.customer.findUnique({ where: { id: bill.customerId } });
        if (customerExists) {
          await tx.customer.update({
            where: { id: bill.customerId },
            data: {
              totalCredit: { decrement: bill.grandTotal },
              totalPaid:   { decrement: bill.paid },
            },
          });
        }
      }

      // Delete the bill (cascades to items and payments automatically)
      await tx.bill.delete({ where: { id: billId } });
    });

    res.json({ success: true, message: "Bill deleted successfully" });
  } catch (err) {
    next(err);
  }
});
