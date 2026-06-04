import { PrismaClient, BillType, BillStatus, PurchaseStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Suppliers ─────────────────────────────────────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { phone: "9000000001" },
    update: {},
    create: {
      name: "Suresh Kumar",
      shopName: "Agro Foods Ltd",
      phone: "9000000001",
      address: "Jamnagar, GJ",
      email: "suresh@agro.com",
    },
  });

  // ─── Products ──────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.productBatch.upsert({
      where: { batchId: "B001" },
      update: {},
      create: { batchId: "B001", name: "Basmati Rice 5kg",  category: "Grains",     costPrice: 280, sellingPrice: 350, qty: 45, minStock: 10, receivedDate: new Date("2025-05-01") },
    }),
    prisma.productBatch.upsert({
      where: { batchId: "B002" },
      update: {},
      create: { batchId: "B002", name: "Toor Dal 1kg",       category: "Pulses",     costPrice:  95, sellingPrice: 130, qty:  6, minStock: 10, receivedDate: new Date("2025-05-01") },
    }),
    prisma.productBatch.upsert({
      where: { batchId: "B003" },
      update: {},
      create: { batchId: "B003", name: "Sunflower Oil 1L",   category: "Oils",       costPrice: 120, sellingPrice: 155, qty: 22, minStock:  8, receivedDate: new Date("2025-05-01") },
    }),
    prisma.productBatch.upsert({
      where: { batchId: "B004" },
      update: {},
      create: { batchId: "B004", name: "Amul Butter 500g",   category: "Dairy",      costPrice: 210, sellingPrice: 250, qty:  3, minStock:  5, receivedDate: new Date("2025-05-01") },
    }),
    prisma.productBatch.upsert({
      where: { batchId: "B005" },
      update: {},
      create: { batchId: "B005", name: "Sugar 1kg",           category: "Staples",    costPrice:  42, sellingPrice:  55, qty: 60, minStock: 15, receivedDate: new Date("2025-05-01") },
    }),
    prisma.productBatch.upsert({
      where: { batchId: "B006" },
      update: {},
      create: { batchId: "B006", name: "Tea Powder 500g",     category: "Beverages",  costPrice: 130, sellingPrice: 170, qty: 18, minStock:  5, receivedDate: new Date("2025-05-01") },
    }),
  ]);

  // ─── Customers ─────────────────────────────────────────────────────────
  const [ramesh, sunita, deepak] = await Promise.all([
    prisma.customer.upsert({
      where: { phone: "9876543210" },
      update: {},
      create: { name: "Ramesh Patel",  phone: "9876543210", email: "ramesh@email.com",  totalCredit: 5200, totalPaid: 4000 },
    }),
    prisma.customer.upsert({
      where: { phone: "9898765432" },
      update: {},
      create: { name: "Sunita Shah",   phone: "9898765432", email: "sunita@email.com",  totalCredit: 3800, totalPaid: 3800 },
    }),
    prisma.customer.upsert({
      where: { phone: "9123456789" },
      update: {},
      create: { name: "Deepak Mehta",  phone: "9123456789", email: "deepak@email.com",  totalCredit: 1200, totalPaid:  800 },
    }),
  ]);

  // ─── Bills ─────────────────────────────────────────────────────────────
  const billExists1 = await prisma.bill.findUnique({ where: { id: "INV-001" } });
  if (!billExists1) {
    await prisma.bill.create({
      data: {
        id: "INV-001",
        customerId: ramesh.id,
        customerName: "Ramesh Patel",
        billType: BillType.INVOICE,
        subtotal: 700,
        discount: 50,
        grandTotal: 650,
        paid: 500,
        status: BillStatus.PARTIAL,
        date: new Date("2025-05-20"),
        daySeq: 1,
        items: {
          create: [{ productId: products[0].id, batchId: "B001", name: "Basmati Rice 5kg", price: 350, qty: 2, total: 700 }],
        },
        payments: {
          create: [{ amount: 500, date: new Date("2025-05-20") }],
        },
      },
    });
  }

  const billExists2 = await prisma.bill.findUnique({ where: { id: "INV-002" } });
  if (!billExists2) {
    await prisma.bill.create({
      data: {
        id: "INV-002",
        customerId: sunita.id,
        customerName: "Sunita Shah",
        billType: BillType.INVOICE,
        subtotal: 465,
        discount: 0,
        grandTotal: 465,
        paid: 465,
        status: BillStatus.PAID,
        date: new Date("2025-05-22"),
        daySeq: 1,
        items: {
          create: [{ productId: products[2].id, batchId: "B003", name: "Sunflower Oil 1L", price: 155, qty: 3, total: 465 }],
        },
        payments: {
          create: [{ amount: 465, date: new Date("2025-05-22") }],
        },
      },
    });
  }

  // ─── Purchase ──────────────────────────────────────────────────────────
  const poExists = await prisma.purchase.findUnique({ where: { id: "PO-001" } });
  if (!poExists) {
    await prisma.purchase.create({
      data: {
        id: "PO-001",
        supplierId: supplier.id,
        supplierName: "Agro Foods Ltd",
        date: new Date("2025-05-15"),
        orderNo: "AGF-2025-45",
        total: 14000,
        paid: 14000,
        status: PurchaseStatus.PAID,
        items: {
          create: [{ productId: products[0].id, batchId: "B001", name: "Basmati Rice 5kg", qtyReceived: 50, purchasePrice: 280 }],
        },
        payments: {
          create: [{ amount: 14000, date: new Date("2025-05-15") }],
        },
      },
    });
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
