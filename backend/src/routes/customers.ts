import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export const customerRouter = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const createCustomerSchema = z.object({
  name:  z.string().min(1),
  phone: z.string().min(10).optional().nullable().or(z.literal("")),
  email: z.string().email().optional().nullable().or(z.literal("")),
});

const updateCustomerSchema = createCustomerSchema.partial();

// ── GET /customers ────────────────────────────────────────────────────────────

customerRouter.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;
    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name:  { contains: String(search), mode: "insensitive" } },
              { phone: { contains: String(search) } },
              { email: { contains: String(search), mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
    });
    res.json(customers);
  } catch (err) {
    next(err);
  }
});

// ── GET /customers/:id ────────────────────────────────────────────────────────

customerRouter.get("/:id", async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        bills: {
          include: { items: true, payments: true },
          orderBy: { date: "desc" },
        },
      },
    });
    if (!customer) throw new AppError(404, "Customer not found");
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

// ── POST /customers ───────────────────────────────────────────────────────────

customerRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createCustomerSchema.parse(req.body);
    const data = {
      name: parsed.name,
      phone: parsed.phone === "" || parsed.phone === undefined || parsed.phone === null ? null : parsed.phone,
      email: parsed.email === "" || parsed.email === undefined || parsed.email === null ? null : parsed.email,
    };
    const customer = await prisma.customer.create({ data });
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /customers/:id ──────────────────────────────────────────────────────

customerRouter.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateCustomerSchema.parse(req.body);
    const data: any = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if ("phone" in req.body) {
      data.phone = parsed.phone === "" || parsed.phone === undefined || parsed.phone === null ? null : parsed.phone;
    }
    if ("email" in req.body) {
      data.email = parsed.email === "" || parsed.email === undefined || parsed.email === null ? null : parsed.email;
    }
    const customer = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /customers/:id ─────────────────────────────────────────────────────

customerRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.customer.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ── GET /customers/:id/ledger (outstanding balance summary) ───────────────────

customerRouter.get("/:id/ledger", async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        bills: {
          where: { status: { not: "PAID" } },
          include: { payments: true },
          orderBy: { date: "asc" },
        },
      },
    });
    if (!customer) throw new AppError(404, "Customer not found");

    const outstanding = customer.totalCredit - customer.totalPaid;
    res.json({ customer, outstanding, unpaidBills: customer.bills });
  } catch (err) {
    next(err);
  }
});
