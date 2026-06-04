# Shop Management — Backend API

REST API backend for the Shop Management System built with **Express**, **Prisma ORM**, and **PostgreSQL**.

---

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Runtime    | Node.js 20+                   |
| Framework  | Express 4                     |
| ORM        | Prisma 5                      |
| Database   | PostgreSQL 14+                |
| Validation | Zod                           |
| Language   | TypeScript 5                  |

---

## Project Structure

```
shop-backend/
├── prisma/
│   ├── schema.prisma       # Database schema & Prisma models
│   └── seed.ts             # Seed script with demo data
├── src/
│   ├── lib/
│   │   └── prisma.ts       # Prisma client singleton
│   ├── middleware/
│   │   └── errorHandler.ts # Global error handler (Zod + Prisma + AppError)
│   ├── routes/
│   │   ├── products.ts     # Inventory / product batches
│   │   ├── customers.ts    # Customer management + ledger
│   │   ├── bills.ts        # Invoices, credit/debit memos, payments
│   │   ├── suppliers.ts    # Supplier management
│   │   ├── purchases.ts    # Purchase orders + payments + stock update
│   │   └── dashboard.ts    # Analytics & summary stats
│   └── index.ts            # Express app + server bootstrap
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Quick Start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL running locally (or a remote URL)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — set your DATABASE_URL
```

### 4. Set up database

```bash
# Push schema to your database (dev / first-time)
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate

# Generate Prisma client
npm run db:generate

# (Optional) seed with demo data
npm run db:seed
```

### 5. Run the server

```bash
# Development (hot-reload)
npm run dev

# Production
npm run build && npm start
```

Server starts on **http://localhost:4000**

---

## API Reference

All endpoints are prefixed with `/api`.

### Health

| Method | Path      | Description        |
|--------|-----------|--------------------|
| GET    | `/health` | Liveness check     |

---

### Products `/api/products`

| Method | Path                       | Description                        |
|--------|----------------------------|------------------------------------|
| GET    | `/`                        | List all products                  |
| GET    | `/?category=Grains`        | Filter by category                 |
| GET    | `/?lowStock=true`          | Only items below minStock          |
| GET    | `/:id`                     | Get product by ID                  |
| POST   | `/`                        | Create new product batch           |
| PATCH  | `/:id`                     | Update product batch               |
| DELETE | `/:id`                     | Delete product batch               |
| GET    | `/meta/categories`         | All distinct categories            |

**POST body example:**
```json
{
  "batchId":      "B010",
  "name":         "Atta 5kg",
  "category":     "Staples",
  "costPrice":    180,
  "sellingPrice": 220,
  "qty":          30,
  "minStock":     10,
  "receivedDate": "2025-06-01T00:00:00.000Z"
}
```

---

### Customers `/api/customers`

| Method | Path              | Description                          |
|--------|-------------------|--------------------------------------|
| GET    | `/`               | List all customers                   |
| GET    | `/?search=ramesh` | Search by name/phone/email           |
| GET    | `/:id`            | Get customer + all bills             |
| GET    | `/:id/ledger`     | Outstanding balance summary          |
| POST   | `/`               | Create customer                      |
| PATCH  | `/:id`            | Update customer                      |
| DELETE | `/:id`            | Delete customer                      |

**POST body example:**
```json
{
  "name":  "Priya Joshi",
  "phone": "9900112233",
  "email": "priya@example.com"
}
```

---

### Bills `/api/bills`

| Method | Path                  | Description                             |
|--------|-----------------------|-----------------------------------------|
| GET    | `/`                   | List all bills                          |
| GET    | `/?status=UNPAID`     | Filter by status (PAID/PARTIAL/UNPAID)  |
| GET    | `/?from=...&to=...`   | Filter by date range                    |
| GET    | `/?search=INV-001`    | Search by bill ID or customer name      |
| GET    | `/:id`                | Get bill with items + payments          |
| POST   | `/`                   | Create new bill (deducts stock)         |
| POST   | `/:id/payments`       | Add payment to a bill                   |
| GET    | `/stats/summary`      | Revenue / collection summary            |

**POST /bills body:**
```json
{
  "customerId":   1,
  "customerName": "Ramesh Patel",
  "billType":     "INVOICE",
  "items": [
    { "productId": 1, "batchId": "B001", "name": "Basmati Rice 5kg", "price": 350, "qty": 2, "total": 700 }
  ],
  "subtotal":   700,
  "discount":   50,
  "grandTotal": 650,
  "paid":       300,
  "date":       "2025-06-15T10:00:00.000Z"
}
```

**POST /:id/payments body:**
```json
{
  "amount": 200,
  "date":   "2025-06-20T00:00:00.000Z",
  "note":   "Cash payment"
}
```

---

### Suppliers `/api/suppliers`

| Method | Path      | Description            |
|--------|-----------|------------------------|
| GET    | `/`       | List all suppliers     |
| GET    | `/:id`    | Get supplier + orders  |
| POST   | `/`       | Create supplier        |
| PATCH  | `/:id`    | Update supplier        |
| DELETE | `/:id`    | Delete supplier        |

---

### Purchases `/api/purchases`

| Method | Path                  | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/`                   | List all purchase orders                 |
| GET    | `/?status=REMAINING`  | Filter by status (PAID/REMAINING)        |
| GET    | `/:id`                | Get PO with items + payments             |
| POST   | `/`                   | Create PO (auto-updates inventory)       |
| POST   | `/:id/payments`       | Add payment to a purchase order          |
| GET    | `/stats/summary`      | Purchase spend summary                   |

**POST /purchases body:**
```json
{
  "supplierId":   1,
  "supplierName": "Agro Foods Ltd",
  "date":         "2025-06-10T00:00:00.000Z",
  "orderNo":      "AGF-2025-60",
  "items": [
    { "productId": 1, "batchId": "B001", "name": "Basmati Rice 5kg", "qtyReceived": 100, "purchasePrice": 270 }
  ],
  "total": 27000,
  "paid":  10000
}
```

---

### Dashboard `/api/dashboard`

| Method | Path  | Description                                     |
|--------|-------|-------------------------------------------------|
| GET    | `/`   | Today's sales, low stock, top products, charts  |

Response includes today's revenue, monthly trend (last 6 months), top-selling products, low-stock alerts, and outstanding balances.

---

## Database Schema (overview)

```
ProductBatch   ─── BillItem ──────── Bill ─── BillPayment
               ─── PurchaseItem ─── Purchase ─ PurchasePayment
Customer ───────────────────────── Bill
Supplier ───────────────────────── Purchase
```

---

## Key Business Logic

- **Stock deduction**: Creating a bill automatically decrements `ProductBatch.qty` for each item in a transaction. Insufficient stock raises a 400 error.
- **Stock increment**: Creating a purchase order increments `ProductBatch.qty`. If the product doesn't exist yet, a new batch is auto-created.
- **Bill status**: Automatically computed — `UNPAID → PARTIAL → PAID` based on paid vs grandTotal.
- **Customer ledger**: `totalCredit` and `totalPaid` on the `Customer` row are updated atomically with every bill and payment.
- **Sequential IDs**: `INV-001`, `INV-002`… and `PO-001`, `PO-002`… generated from the last DB row to maintain friendly display IDs.
- **Day sequence**: Each bill gets a `daySeq` counter (1st bill of the day = 1, 2nd = 2…) for daily register tracking.
