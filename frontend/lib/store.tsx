"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProductBatch = {
  id: number;
  batchId: string;
  name: string;
  category?: string;
  costPrice: number;
  sellingPrice: number;
  qty: number;
  minStock: number;
  receivedDate: string;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
  totalCredit: number;
  totalPaid: number;
};

export type BillItem = {
  productId: number;
  batchId: string;
  name: string;
  price: number;
  qty: number;
  total: number;
};

export type BillPayment = {
  id: number;
  amount: number;
  date: string;
  note?: string;
};

export type Bill = {
  id: string;
  customerId: number | null;
  customerName: string;
  billType: "INVOICE" | "CREDIT_MEMO" | "DEBIT_MEMO";
  items: BillItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paid: number;
  payments: BillPayment[];
  status: "PAID" | "PARTIAL" | "UNPAID";
  date: string;
  note?: string;
  daySeq: number;
};

export type Supplier = {
  id: number;
  name: string;
  shopName: string;
  phone: string;
  address: string;
  email: string;
};

export type PurchaseItem = {
  productId: number;
  batchId: string;
  name: string;
  qtyReceived: number;
  purchasePrice: number;
};

export type PurchasePayment = {
  id: number;
  amount: number;
  date: string;
  note?: string;
};

export type Purchase = {
  id: string;
  supplierId: number;
  supplierName: string;
  date: string;
  orderNo: string;
  items: PurchaseItem[];
  total: number;
  paid: number;
  payments: PurchasePayment[];
  status: "PAID" | "REMAINING";
};

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${options?.method ?? "GET"} ${path} failed (${res.status}): ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Context type ──────────────────────────────────────────────────────────────

type AppCtx = {
  products: ProductBatch[];
  customers: Customer[];
  bills: Bill[];
  purchases: Purchase[];
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  // Products
  addProductBatch: (p: Omit<ProductBatch, "id">) => Promise<void>;
  updateProductBatch: (id: number, updates: Partial<ProductBatch>) => Promise<void>;
  deleteProductBatch: (id: number) => Promise<void>;
  // Customers
  addCustomer: (c: { name: string; phone: string; email?: string }) => Promise<void>;
  updateCustomer: (id: number, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  // Bills
  addBill: (bill: {
    customerId?: number | null;
    customerName: string;
    billType?: string;
    items: BillItem[];
    subtotal: number;
    discount: number;
    grandTotal: number;
    paid: number;
    status: string;
    date: string;
    note?: string;
    daySeq?: number;
  }) => Promise<string>;
  addBillPayment: (billId: string, amount: number, date: string, note?: string) => Promise<void>;
  updateBill: (id: string, bill: any) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  // Suppliers
  addSupplier: (s: Omit<Supplier, "id">) => Promise<number>;
  updateSupplier: (id: number, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: number) => Promise<void>;
  // Purchases
  addPurchase: (po: {
    supplierId: number;
    supplierName: string;
    date: string;
    orderNo: string;
    items: PurchaseItem[];
    total: number;
    paid: number;
    status: string;
  }) => Promise<void>;
  addPurchasePayment: (poId: string, amount: number, date: string, note?: string) => Promise<void>;
};

const AppContext = createContext<AppCtx | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductBatch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [p, c, b, pu, s] = await Promise.all([
        apiFetch<ProductBatch[]>("/api/products"),
        apiFetch<Customer[]>("/api/customers"),
        apiFetch<Bill[]>("/api/bills"),
        apiFetch<Purchase[]>("/api/purchases"),
        apiFetch<Supplier[]>("/api/suppliers"),
      ]);
      setProducts(p);
      setCustomers(c);
      setBills(b);
      setPurchases(pu);
      setSuppliers(s);
    } catch (err: any) {
      setError(err.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Products ────────────────────────────────────────────────────────────────

  const addProductBatch = async (p: Omit<ProductBatch, "id">) => {
    await apiFetch("/api/products", { method: "POST", body: JSON.stringify(p) });
    await fetchAll();
  };

  const updateProductBatch = async (id: number, updates: Partial<ProductBatch>) => {
    await apiFetch(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
    await fetchAll();
  };

  const deleteProductBatch = async (id: number) => {
    await apiFetch(`/api/products/${id}`, { method: "DELETE" });
    await fetchAll();
  };

  // ── Customers ───────────────────────────────────────────────────────────────

  const addCustomer = async (c: { name: string; phone: string; email?: string }) => {
    await apiFetch("/api/customers", { method: "POST", body: JSON.stringify(c) });
    await fetchAll();
  };

  const updateCustomer = async (id: number, updates: Partial<Customer>) => {
    await apiFetch(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
    await fetchAll();
  };

  const deleteCustomer = async (id: number) => {
    await apiFetch(`/api/customers/${id}`, { method: "DELETE" });
    await fetchAll();
  };

  // ── Bills ───────────────────────────────────────────────────────────────────

  const addBill = async (bill: any): Promise<string> => {
    const created = await apiFetch<Bill>("/api/bills", {
      method: "POST",
      body: JSON.stringify(bill),
    });
    await fetchAll();
    return created.id;
  };

  const addBillPayment = async (billId: string, amount: number, date: string, note?: string) => {
    await apiFetch(`/api/bills/${billId}/payments`, {
      method: "POST",
      body: JSON.stringify({ amount, date, note }),
    });
    await fetchAll();
  };
  const updateBill = async (id: string, bill: any) => {
    await apiFetch(`/api/bills/${id}`, {
      method: "PATCH",
      body: JSON.stringify(bill),
    });
    await fetchAll();
  };

  const deleteBill = async (id: string) => {
    await apiFetch(`/api/bills/${id}`, { method: "DELETE" });
    await fetchAll();
  };
  // ── Suppliers ───────────────────────────────────────────────────────────────

  const addSupplier = async (s: Omit<Supplier, "id">): Promise<number> => {
    const created = await apiFetch<Supplier>("/api/suppliers", {
      method: "POST",
      body: JSON.stringify(s),
    });
    await fetchAll();
    return created.id;
  };

  const updateSupplier = async (id: number, updates: Partial<Supplier>) => {
    await apiFetch(`/api/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
    await fetchAll();
  };

  const deleteSupplier = async (id: number) => {
    await apiFetch(`/api/suppliers/${id}`, { method: "DELETE" });
    await fetchAll();
  };

  // ── Purchases ───────────────────────────────────────────────────────────────

  const addPurchase = async (po: any) => {
    await apiFetch("/api/purchases", { method: "POST", body: JSON.stringify(po) });
    await fetchAll();
  };

  const addPurchasePayment = async (poId: string, amount: number, date: string, note?: string) => {
    await apiFetch(`/api/purchases/${poId}/payments`, {
      method: "POST",
      body: JSON.stringify({ amount, date, note }),
    });
    await fetchAll();
  };

  return (
    <AppContext.Provider
      value={{
        products, customers, bills, purchases, suppliers,
        loading, error, refetch: fetchAll,
        addProductBatch, updateProductBatch, deleteProductBatch,
        addCustomer, updateCustomer, deleteCustomer,
        addBill, addBillPayment, updateBill, deleteBill,
        addSupplier, updateSupplier, deleteSupplier,
        addPurchase, addPurchasePayment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export const fmt = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

export const getSanitizedInvoiceTitle = (billId: string, customerName: string): string => {
  let invoiceNumber = billId;
  if (billId.toUpperCase().startsWith("INV-")) {
    invoiceNumber = billId.slice(4);
  }
  const cleanName = customerName
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `INV-${invoiceNumber} ${cleanName}`;
};
