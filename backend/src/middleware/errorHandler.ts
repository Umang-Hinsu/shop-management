import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Known app error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  // Prisma unique-constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = (err.meta?.target as string[])?.join(", ") ?? "field";
      return res.status(409).json({ error: `A record with this ${field} already exists.` });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found." });
    }
  }

  console.error("[Unhandled error]", err);
  return res.status(500).json({ error: "Internal server error" });
}
