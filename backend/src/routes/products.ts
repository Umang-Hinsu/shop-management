import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export const productRouter = Router();

// ── Validation Schemas ────────────────────────────────────────────────────────

const createProductSchema = z.object({
  batchId:      z.string().min(1),
  name:         z.string().min(1),
  costPrice:    z.number().positive(),
  sellingPrice: z.number().positive(),
  qty:          z.number().int().min(0),
  minStock:     z.number().int().min(0).default(5),
  receivedDate: z.string().datetime().optional(),
});

const updateProductSchema = createProductSchema.partial().omit({ batchId: true });

// ── GET /products ─────────────────────────────────────────────────────────────

productRouter.get("/", async (req, res, next) => {
  try {
    const { lowStock } = req.query;

    const products = await prisma.productBatch.findMany({
      where: {
        ...(lowStock === "true"
          ? { qty: { lte: prisma.productBatch.fields.minStock } }
          : {}),
      },
      orderBy: { name: "asc" },
    });

    // Low-stock filter handled in JS since Prisma doesn't support column-vs-column comparison
    const result =
      lowStock === "true"
        ? products.filter((p) => p.qty <= p.minStock)
        : products;

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── GET /products/:id ─────────────────────────────────────────────────────────

productRouter.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.productBatch.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!product) throw new AppError(404, "Product not found");
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// ── POST /products ────────────────────────────────────────────────────────────

productRouter.post("/", async (req, res, next) => {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await prisma.productBatch.create({
      data: {
        ...data,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
      },
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /products/:id ───────────────────────────────────────────────────────

productRouter.patch("/:id", async (req, res, next) => {
  try {
    const data = updateProductSchema.parse(req.body);
    const product = await prisma.productBatch.update({
      where: { id: Number(req.params.id) },
      data: {
        ...data,
        ...(data.receivedDate ? { receivedDate: new Date(data.receivedDate) } : {}),
      },
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /products/:id ──────────────────────────────────────────────────────

productRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.productBatch.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

