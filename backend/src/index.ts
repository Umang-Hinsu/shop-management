import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { productRouter } from "./routes/products";
import { customerRouter } from "./routes/customers";
import { billRouter } from "./routes/bills";
import { supplierRouter } from "./routes/suppliers";
import { purchaseRouter } from "./routes/purchases";
import { dashboardRouter } from "./routes/dashboard";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? "*" }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/products", productRouter);
app.use("/api/customers", customerRouter);
app.use("/api/bills", billRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/purchases", purchaseRouter);
app.use("/api/dashboard", dashboardRouter);

// ── Error Handler ─────────────────────────────────────────────────────────────

app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, '192.168.19.217', () => {
  console.log(`🚀 Shop API running on http://localhost:${PORT}`);
});

export default app;
