import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export const supplierRouter = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const createSupplierSchema = z.object({
  name:     z.string().min(1),
  shopName: z.string().min(1),
  phone:    z.string().min(10),
  address:  z.string().optional(),
  email:    z.string().email().optional().or(z.literal("")),
});

const updateSupplierSchema = createSupplierSchema.partial();

// ── GET /suppliers ────────────────────────────────────────────────────────────

supplierRouter.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;
    const suppliers = await prisma.supplier.findMany({
      where: search
        ? {
            OR: [
              { name:     { contains: String(search), mode: "insensitive" } },
              { shopName: { contains: String(search), mode: "insensitive" } },
              { phone:    { contains: String(search) } },
            ],
          }
        : undefined,
      orderBy: { shopName: "asc" },
    });
    res.json(suppliers);
  } catch (err) {
    next(err);
  }
});

// ── GET /suppliers/:id ────────────────────────────────────────────────────────

supplierRouter.get("/:id", async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        purchases: {
          include: { items: true, payments: true },
          orderBy: { date: "desc" },
        },
      },
    });
    if (!supplier) throw new AppError(404, "Supplier not found");
    res.json(supplier);
  } catch (err) {
    next(err);
  }
});

// ── POST /suppliers ───────────────────────────────────────────────────────────

supplierRouter.post("/", async (req, res, next) => {
  try {
    const data = createSupplierSchema.parse(req.body);
    const supplier = await prisma.supplier.create({ data });
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /suppliers/:id ──────────────────────────────────────────────────────

supplierRouter.patch("/:id", async (req, res, next) => {
  try {
    const data = updateSupplierSchema.parse(req.body);
    const supplier = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(supplier);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /suppliers/:id ─────────────────────────────────────────────────────

supplierRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.supplier.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
