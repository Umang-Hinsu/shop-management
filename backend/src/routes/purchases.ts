import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { PurchaseStatus } from "@prisma/client";

export const purchaseRouter = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const purchaseItemSchema = z.object({
  productId:     z.number().int().positive(),
  batchId:       z.string(),
  name:          z.string(),
  qtyReceived:   z.number().int().positive(),
  purchasePrice: z.number().positive(),
});

const createPurchaseSchema = z.object({
  supplierId:   z.number().int().positive(),
  supplierName: z.string().min(1),
  date:         z.string().datetime(),
  orderNo:      z.string().min(1),
  items:        z.array(purchaseItemSchema).min(1),
  total:        z.number().nonnegative(),
  paid:         z.number().nonnegative().default(0),
});

const addPaymentSchema = z.object({
  amount: z.number().positive(),
  date:   z.string().datetime(),
  note:   z.string().optional(),
});

// ── Helper: next PO ID ────────────────────────────────────────────────────────

async function nextPoId(): Promise<string> {
  const last = await prisma.purchase.findFirst({ orderBy: { id: "desc" } });
  if (!last) return "PO-001";
  const num = parseInt(last.id.split("-")[1] ?? "0", 10);
  return `PO-${String(num + 1).padStart(3, "0")}`;
}

// ── Helper: compute status ────────────────────────────────────────────────────

function computeStatus(paid: number, total: number): PurchaseStatus {
  return paid >= total ? PurchaseStatus.PAID : PurchaseStatus.REMAINING;
}

// ── GET /purchases ────────────────────────────────────────────────────────────

purchaseRouter.get("/", async (req, res, next) => {
  try {
    const { status, supplierId, from, to } = req.query;

    const purchases = await prisma.purchase.findMany({
      where: {
        ...(status     ? { status: String(status) as PurchaseStatus } : {}),
        ...(supplierId ? { supplierId: Number(supplierId) }           : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(String(from)) } : {}),
                ...(to   ? { lte: new Date(String(to))   } : {}),
              },
            }
          : {}),
      },
      include: { items: true, payments: true, supplier: true },
      orderBy: { date: "desc" },
    });
    res.json(purchases);
  } catch (err) {
    next(err);
  }
});

// ── GET /purchases/:id ────────────────────────────────────────────────────────

purchaseRouter.get("/:id", async (req, res, next) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: req.params.id },
      include: { items: true, payments: true, supplier: true },
    });
    if (!purchase) throw new AppError(404, "Purchase not found");
    res.json(purchase);
  } catch (err) {
    next(err);
  }
});

// ── POST /purchases ───────────────────────────────────────────────────────────

purchaseRouter.post("/", async (req, res, next) => {
  try {
    const data = createPurchaseSchema.parse(req.body);
    const id     = await nextPoId();
    const status = computeStatus(data.paid, data.total);

    const purchase = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id: data.supplierId } });
      if (!supplier) throw new AppError(404, "Supplier not found");

      const finalItems = [];

      // Update (or create) inventory for each received item first
      for (const item of data.items) {
        // Look up by entered batchId first to see if that batch already exists
        const existingBatch = await tx.productBatch.findUnique({ where: { batchId: item.batchId } });

        let finalProductId = item.productId;

        if (existingBatch) {
          // Batch already exists! Increment quantity and update cost price
          await tx.productBatch.update({
            where: { id: existingBatch.id },
            data: {
              qty:          { increment: item.qtyReceived },
              costPrice:    item.purchasePrice,
              receivedDate: new Date(data.date),
            },
          });
          finalProductId = existingBatch.id;
        } else {
          // Batch doesn't exist. Let's look up the base product from item.productId
          const selectedBase = await tx.productBatch.findUnique({ where: { id: item.productId } });

          // Create a new batch with the entered batchId
          const newBatch = await tx.productBatch.create({
            data: {
              batchId:      item.batchId,
              name:         selectedBase ? selectedBase.name : item.name,
              costPrice:    item.purchasePrice,
              sellingPrice: Math.round(item.purchasePrice * 1.2),
              qty:          item.qtyReceived,
              minStock:     selectedBase ? selectedBase.minStock : 5,
              receivedDate: new Date(data.date),
            },
          });
          finalProductId = newBatch.id;
        }

        finalItems.push({
          productId:     finalProductId,
          batchId:       item.batchId,
          name:          item.name,
          qtyReceived:   item.qtyReceived,
          purchasePrice: item.purchasePrice,
        });
      }

      // Create purchase order with correct productIds in items
      const newPurchase = await tx.purchase.create({
        data: {
          id,
          supplierId:   data.supplierId,
          supplierName: data.supplierName,
          date:         new Date(data.date),
          orderNo:      data.orderNo,
          total:        data.total,
          paid:         data.paid,
          status,
          items:    { create: finalItems },
          payments: data.paid > 0
            ? { create: [{ amount: data.paid, date: new Date(data.date) }] }
            : undefined,
        },
        include: { items: true, payments: true },
      });

      return newPurchase;
    });

    res.status(201).json(purchase);
  } catch (err) {
    next(err);
  }
});

// ── POST /purchases/:id/payments ──────────────────────────────────────────────

purchaseRouter.post("/:id/payments", async (req, res, next) => {
  try {
    const { amount, date, note } = addPaymentSchema.parse(req.body);
    const poId = req.params.id;

    const updated = await prisma.$transaction(async (tx) => {
      const po = await tx.purchase.findUnique({ where: { id: poId } });
      if (!po) throw new AppError(404, "Purchase not found");

      const remaining = po.total - po.paid;
      if (amount > remaining + 0.001) {
        throw new AppError(400, `Payment ₹${amount} exceeds outstanding balance ₹${remaining.toFixed(2)}`);
      }

      const newPaid   = po.paid + amount;
      const newStatus = computeStatus(newPaid, po.total);

      return tx.purchase.update({
        where: { id: poId },
        data: {
          paid:     newPaid,
          status:   newStatus,
          payments: { create: { amount, date: new Date(date), note } },
        },
        include: { items: true, payments: true },
      });
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── GET /purchases/stats/summary ──────────────────────────────────────────────

purchaseRouter.get("/stats/summary", async (req, res, next) => {
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

    const totals = await prisma.purchase.aggregate({
      where: dateFilter,
      _sum:   { total: true, paid: true },
      _count: { id: true },
    });

    res.json({
      totalPurchases:   totals._sum.total ?? 0,
      totalPaid:        totals._sum.paid  ?? 0,
      totalOutstanding: (totals._sum.total ?? 0) - (totals._sum.paid ?? 0),
      count:            totals._count.id,
    });
  } catch (err) {
    next(err);
  }
});
