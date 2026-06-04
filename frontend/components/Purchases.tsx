"use client";

import { useState, useRef, useEffect } from "react";
import { useApp, fmt, Supplier, Purchase } from "@/lib/store";
import { Badge, Modal, StatCard, Btn, FormField, inputCls, selectCls } from "@/components/ui-shared";
import { Search, X } from "lucide-react";

type PurchaseItemForm = {
  productId: string;
  batchCode: string;
  qtyReceived: number;
  purchasePrice: number;
};

function PaymentModal({ purchase, onClose }: { purchase: Purchase; onClose: () => void }) {
  const { addPurchasePayment } = useApp();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const balance = Math.max(0, purchase.total - purchase.paid);

  const handlePay = () => {
    const payAmount = Number(amount);
    if (payAmount <= 0 || payAmount > balance) return;
    // Convert YYYY-MM-DD from date input to full ISO datetime for the backend
    const isoDate = date ? new Date(date + "T00:00:00").toISOString() : new Date().toISOString();
    addPurchasePayment(purchase.id, payAmount, isoDate, note);
    onClose();
  };

  return (
    <Modal title="Record Payment to Supplier" onClose={onClose}>
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-gray-600">PO: {purchase.id}</div>
        <div className="text-lg font-bold text-gray-800">{fmt(purchase.total)} total</div>
        <div className="text-sm text-red-600">Balance due: {fmt(balance)}</div>
      </div>

      <FormField label="Payment Amount (₹)" required>
        <input
          ref={amountRef}
          className={inputCls}
          type="number"
          min="1"
          max={balance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          tabIndex={10}
        />
      </FormField>

      <div className="flex gap-3">
        <FormField label="Date">
          <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} tabIndex={11} />
        </FormField>
        <FormField label="Note">
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" tabIndex={12} />
        </FormField>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Btn onClick={onClose} tabIndex={14}>Cancel</Btn>
        <Btn variant="primary" onClick={handlePay} tabIndex={13}>Record Payment</Btn>
      </div>
    </Modal>
  );
}

function SupplierDetail({ supplierId, onBack, onDeleted }: { supplierId: number; onBack: () => void; onDeleted: () => void }) {
  const { suppliers, purchases, updateSupplier, addPurchasePayment, deleteSupplier } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [payPo, setPayPo] = useState<Purchase | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", shopName: "", phone: "", address: "", email: "" });
  const [editPhoneError, setEditPhoneError] = useState("");

  const s = suppliers.find((x) => x.id === supplierId);
  if (!s) return null;

  const sPurchases = purchases.filter((p) => p.supplierId === supplierId);
  const totalSpent = sPurchases.reduce((sum, p) => sum + p.total, 0);
  const totalPaid  = sPurchases.reduce((sum, p) => sum + p.paid, 0);
  const totalDue   = totalSpent - totalPaid;

  const openEdit = () => {
    setForm({ name: s.name, shopName: s.shopName, phone: s.phone, address: s.address, email: s.email });
    setShowEdit(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (form.phone && form.phone.length < 10) {
      setEditPhoneError("Phone must be at least 10 digits");
      return;
    }
    setEditPhoneError("");
    updateSupplier(s.id, form);
    setShowEdit(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSupplier(s.id);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Header: Back on left, Edit+Delete grouped on right */}
      <div className="flex gap-2 items-center mb-5 flex-wrap">
        <Btn onClick={onBack} tabIndex={1}>← Back</Btn>
        <div className="flex gap-2 ml-auto">
          <Btn onClick={openEdit} tabIndex={2}>Edit Supplier</Btn>
          <Btn variant="danger" onClick={() => setConfirmDelete(true)} tabIndex={3}>
            🗑️ Delete Supplier
          </Btn>
        </div>
      </div>

      {/* Profile card */}
      <div className="flex gap-4 items-center mb-5">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-700 shrink-0">
          {s.shopName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{s.shopName}</h2>
          <div className="text-sm text-gray-500">{s.name}{s.phone ? ` · ${s.phone}` : ""}</div>
          {s.address && <div className="text-xs text-gray-400">{s.address}</div>}
          {s.email && <div className="text-xs text-gray-400">{s.email}</div>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Orders" value={sPurchases.length} color="blue" />
        <StatCard label="Total Purchased" value={fmt(totalSpent)} color="amber" />
        <StatCard label="Total Paid" value={fmt(totalPaid)} color="green" />
        <StatCard label="Amount Due" value={fmt(totalDue)} color={totalDue > 0 ? "red" : "green"} />
          {/* Order history */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 text-sm font-semibold text-gray-700">Order History</div>
        {sPurchases.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No purchase orders yet</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {["PO #", "Date", "Order No.", "Total", "Paid", "Due", "Status", ""].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 border-b border-gray-100 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...sPurchases].reverse().map((p) => {
                  const due = Math.max(0, p.total - p.paid);
                  return (
                    <>
                      {/* Main order row */}
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/40 transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-blue-600">{p.id}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{new Date(p.date).toLocaleDateString("en-IN")}</td>
                        <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{p.orderNo || "—"}</td>
                        <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{fmt(p.total)}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{fmt(p.paid)}</td>
                        <td className={`px-3 py-2.5 font-medium whitespace-nowrap ${due > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(due)}</td>
                        <td className="px-3 py-2.5">
                          <Badge color={p.status === "PAID" ? "green" : "amber"}>{p.status}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          {due > 0 && (
                            <Btn variant="success" onClick={() => setPayPo(p)} className="!px-2 !py-1 !text-xs whitespace-nowrap">Pay</Btn>
                          )}
                        </td>
                      </tr>
                      {/* Items sub-row */}
                      {p.items.length > 0 && (
                        <tr key={`${p.id}-items`} className="border-b border-gray-50 bg-gray-50/30">
                          <td colSpan={8} className="px-4 py-2">
                            <div className="flex flex-wrap gap-1.5">
                              {p.items.map((item, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                                  <span className="font-medium text-gray-700">{item.name}</span>
                                  <span className="text-gray-400">×{item.qtyReceived}</span>
                                  <span className="text-amber-600">@ {fmt(item.purchasePrice)}</span>
                                </span>
                              ))}
                            </div>
                            {/* Payment history in sub-row */}
                            {p.payments && p.payments.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                                {p.payments.map((pay) => (
                                  <span key={pay.id} className="text-xs text-gray-500 whitespace-nowrap">
                                    {new Date(pay.date).toLocaleDateString("en-IN")} — <span className="font-semibold text-emerald-600">{fmt(pay.amount)}</span>{pay.note ? ` (${pay.note})` : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

      {/* Edit supplier modal */}
      {showEdit && (
        <Modal title="Edit Supplier" onClose={() => setShowEdit(false)}>
          <FormField label="Contact Person Name" required>
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} tabIndex={10} />
          </FormField>
          <FormField label="Shop / Company Name">
            <input className={inputCls} value={form.shopName} onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))} tabIndex={11} />
          </FormField>
          <FormField label="Phone Number">
            <input
              className={`${inputCls}${editPhoneError ? " border-red-400" : ""}`}
              value={form.phone}
              onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); setEditPhoneError(""); }}
              placeholder="e.g. 9876543210"
              tabIndex={12}
            />
            {editPhoneError && <p className="text-xs text-red-500 mt-1">{editPhoneError}</p>}
          </FormField>
          <FormField label="Address">
            <input className={inputCls} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} tabIndex={13} />
          </FormField>
          <FormField label="Email">
            <input className={inputCls} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} tabIndex={14} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Btn onClick={() => setShowEdit(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSave}>Save Changes</Btn>
          </div>
        </Modal>
      )}

      {payPo && <PaymentModal purchase={payPo} onClose={() => setPayPo(null)} />}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal title="Delete Supplier" onClose={() => setConfirmDelete(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete <strong>{s.shopName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setConfirmDelete(false)}>Cancel</Btn>
              <Btn variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, Delete"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Purchases() {
  const { products, purchases, suppliers, addPurchase, addSupplier, updateSupplier } = useApp();
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [payPurchase, setPayPurchase] = useState<Purchase | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [orderNo, setOrderNo] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [items, setItems] = useState<PurchaseItemForm[]>([{ productId: "", batchCode: "", qtyReceived: 1, purchasePrice: 0 }]);
  const [supForm, setSupForm] = useState({ name: "", shopName: "", phone: "", address: "", email: "" });
  const [supPhoneError, setSupPhoneError] = useState("");
  const [supSearch, setSupSearch] = useState("");
  const supNameRef = useRef<HTMLInputElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (showForm) setTimeout(() => firstFieldRef.current?.focus(), 50);
  }, [showForm]);

  useEffect(() => {
    if (showSupplierForm) setTimeout(() => supNameRef.current?.focus(), 50);
  }, [showSupplierForm]);

  const addItem = () => setItems((i) => [...i, { productId: "", batchCode: "", qtyReceived: 1, purchasePrice: 0 }]);
  const removeItem = (idx: number) => setItems((i) => i.filter((_, ii) => ii !== idx));
  const updateItem = (idx: number, field: keyof PurchaseItemForm, val: string | number) =>
    setItems((i) => i.map((item, ii) => (ii === idx ? { ...item, [field]: val } : item)));

  const totalCost = items.reduce((s, i) => s + i.qtyReceived * i.purchasePrice, 0);

  const handleSave = () => {
    if (!supplierId || items.some((i) => !i.productId)) return;
    const sup = suppliers.find((s) => s.id === Number(supplierId));
    const poItems = items.map((i, idx) => {
      const p = products.find((x) => x.id === Number(i.productId));
      const batchCode = i.batchCode.trim() || `B${String(Date.now()).slice(-6)}${idx}`;
      return { productId: Number(i.productId), batchId: batchCode, name: p?.name || "", qtyReceived: Number(i.qtyReceived), purchasePrice: Number(i.purchasePrice) };
    });
    const paid = Number(paidAmount);
    // Convert YYYY-MM-DD from date input to full ISO datetime for the backend
    const isoDate = date ? new Date(date + "T00:00:00").toISOString() : new Date().toISOString();
    addPurchase({
      supplierId: Number(supplierId),
      supplierName: sup?.shopName || sup?.name || "",
      date: isoDate,
      orderNo,
      items: poItems,
      total: totalCost,
      paid,
      status: paid >= totalCost ? "PAID" : "REMAINING",
    });
    setShowForm(false);
    setSupplierId("");
    setDate(new Date().toISOString().split("T")[0]);
    setOrderNo("");
    setPaidAmount(0);
    setItems([{ productId: "", batchCode: "", qtyReceived: 1, purchasePrice: 0 }]);
  };

  const handleSaveSupplier = () => {
    if (!supForm.name) return;
    if (supForm.phone && supForm.phone.length < 10) {
      setSupPhoneError("Phone must be at least 10 digits");
      return;
    }
    setSupPhoneError("");
    if (editSupplier) {
      updateSupplier(editSupplier.id, supForm);
    } else {
      addSupplier(supForm);
    }
    setShowSupplierForm(false);
    setEditSupplier(null);
    setSupForm({ name: "", shopName: "", phone: "", address: "", email: "" });
  };

  const openEditSupplier = (s: Supplier) => {
    setSupForm({ name: s.name, shopName: s.shopName, phone: s.phone, address: s.address, email: s.email });
    setEditSupplier(s);
    setShowSupplierForm(true);
  };

  const [search, setSearch] = useState("");

  const totalSpent = purchases.reduce((s, p) => s + p.total, 0);
  const totalPending = purchases.filter((p) => p.status === "REMAINING").reduce((s, p) => s + (p.total - p.paid), 0);

  const filteredPurchases = [...purchases].reverse().filter((p) =>
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    p.orderNo.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(supSearch.toLowerCase()) ||
      s.shopName.toLowerCase().includes(supSearch.toLowerCase()) ||
      s.phone.includes(supSearch) ||
      (s.email && s.email.toLowerCase().includes(supSearch.toLowerCase())) ||
      (s.address && s.address.toLowerCase().includes(supSearch.toLowerCase()))
  );

  if (selectedSupplier !== null) {
    return (
      <SupplierDetail
        supplierId={selectedSupplier}
        onBack={() => setSelectedSupplier(null)}
        onDeleted={() => setSelectedSupplier(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-0.5">Purchases</h2>
          <p className="text-sm text-gray-500">Track stock from suppliers</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => { setEditSupplier(null); setSupForm({ name: "", shopName: "", phone: "", address: "", email: "" }); setShowSupplierForm(true); }} tabIndex={1}>+ Add Supplier</Btn>
          <Btn variant="primary" onClick={() => setShowForm(true)} tabIndex={2}>+ New Purchase</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Orders" value={purchases.length} color="blue" />
        <StatCard label="Total Spent" value={fmt(totalSpent)} color="amber" />
        <StatCard label="Suppliers" value={suppliers.length} color="gray" />
        <StatCard label="Pending Payment" value={fmt(totalPending)} color={totalPending > 0 ? "red" : "green"} />
      </div>

      {/* Suppliers list */}
      {suppliers.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-5">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm font-semibold text-gray-700">Suppliers</div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                className="w-full border border-gray-200 rounded-lg pl-8 pr-8 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Search by name, shop, phone..."
                value={supSearch}
                onChange={(e) => setSupSearch(e.target.value)}
              />
              {supSearch && (
                <button onClick={() => setSupSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {["Name", "Shop", "Phone", "Address", "Email"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 border-b border-gray-100 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 hover:bg-amber-50/40 cursor-pointer transition-colors"
                    onClick={() => setSelectedSupplier(s.id)}
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{s.name}</td>
                    <td className="px-4 py-2.5 text-amber-700 font-semibold whitespace-nowrap">{s.shopName}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{s.phone}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{s.address}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSuppliers.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">No suppliers found</div>
          )}
        </div>
      )}

      {/* Purchase orders list */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-gray-700">Purchase Orders</div>
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
            <input
              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Search PO#, supplier, order no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {filteredPurchases.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">{purchases.length === 0 ? "No purchases recorded yet" : "No orders match your search"}</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredPurchases.map((p) => {
              const remaining = p.total - p.paid;
              return (
                <div key={p.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-600">{p.id}</span>
                        {p.orderNo && <span className="text-xs text-gray-400">· {p.orderNo}</span>}
                      </div>
                      <div className="text-sm font-semibold text-gray-800">{p.supplierName}</div>
                      <div className="text-xs text-gray-400">{p.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">{fmt(p.total)}</div>
                      <Badge color={p.status === "PAID" ? "green" : "amber"}>{p.status}</Badge>
                      {p.status === "REMAINING" && (
                        <div className="text-xs text-red-600 mt-0.5">{fmt(remaining)} remaining</div>
                      )}
                    </div>
                  </div>
                  {/* Items as pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.items.map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <span className="text-gray-400">×{item.qtyReceived}</span>
                        <span className="text-blue-600">@ {fmt(item.purchasePrice)}</span>
                      </span>
                    ))}
                  </div>
                  {/* Payment history */}
                  {p.payments && p.payments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 mb-1">Payment History</div>
                      {p.payments.map((pay) => (
                        <div key={pay.id} className="flex justify-between text-xs py-0.5">
                          <span className="text-gray-500">{new Date(pay.date).toLocaleDateString("en-IN")}{pay.note ? ` - ${pay.note}` : ""}</span>
                          <span className="font-medium text-emerald-600">{fmt(pay.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Purchase Modal */}
      {showForm && (
        <Modal title="New Purchase Order" onClose={() => setShowForm(false)} width="max-w-2xl">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <FormField label="Supplier" required>
              <select ref={firstFieldRef} className={selectCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)} tabIndex={10}>
                <option value="">Select supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.shopName}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Purchase Order No.">
              <input className={inputCls} value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="e.g. PO-2025-001" tabIndex={11} />
            </FormField>
            <FormField label="Date">
              <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} tabIndex={12} />
            </FormField>
            <FormField label="Amount Paid (₹)">
              <input className={inputCls} type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} tabIndex={13} />
            </FormField>
          </div>

          <div className="font-semibold text-sm text-gray-700 mb-3 mt-2">Items Received</div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx}>
                {idx === 0 && (
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 mb-1">
                    <label className="block text-xs text-gray-400">Product</label>
                    <label className="block text-xs text-gray-400">Batch Code</label>
                    <label className="block text-xs text-gray-400">Qty</label>
                    <label className="block text-xs text-gray-400">Price</label>
                    <div></div>
                  </div>
                )}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center">
                  <select className={selectCls} value={item.productId} onChange={(e) => updateItem(idx, "productId", e.target.value)} tabIndex={20 + idx * 4}>
                    <option value="">Select product...</option>
                    {products.map((prod) => <option key={prod.id} value={prod.id}>{prod.name}</option>)}
                  </select>
                  <input className={inputCls} value={item.batchCode} onChange={(e) => updateItem(idx, "batchCode", e.target.value)} placeholder="e.g. B001" tabIndex={21 + idx * 4} />
                  <input className={inputCls} type="number" min="1" value={item.qtyReceived} onChange={(e) => updateItem(idx, "qtyReceived", Number(e.target.value))} tabIndex={22 + idx * 4} />
                  <input className={inputCls} type="number" min="0" value={item.purchasePrice} onChange={(e) => updateItem(idx, "purchasePrice", Number(e.target.value))} tabIndex={23 + idx * 4} />
                  <button onClick={() => removeItem(idx)} className="w-8 h-9 flex items-center justify-center text-red-400 hover:text-red-600 rounded border border-gray-200 hover:bg-red-50 transition-colors">×</button>
                </div>
              </div>
            ))}
          </div>

          <Btn onClick={addItem} className="mt-3 !text-xs" tabIndex={50}>+ Add Item</Btn>

          <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100">
            <div>
              <div className="text-sm font-bold text-gray-800">Total: {fmt(totalCost)}</div>
              <div className={`text-xs mt-0.5 ${paidAmount >= totalCost ? "text-emerald-600" : "text-amber-600"}`}>
                {paidAmount >= totalCost ? "Fully paid" : `${fmt(totalCost - paidAmount)} remaining`}
              </div>
            </div>
            <div className="flex gap-2">
              <Btn onClick={() => setShowForm(false)} tabIndex={52}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSave} tabIndex={51}>Save & Update Stock</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <Modal title={editSupplier ? "Edit Supplier" : "Add Supplier"} onClose={() => { setShowSupplierForm(false); setEditSupplier(null); }}>
          <FormField label="Contact Person Name" required>
            <input ref={supNameRef} className={inputCls} value={supForm.name} onChange={(e) => setSupForm((f) => ({ ...f, name: e.target.value }))} tabIndex={10} />
          </FormField>
          <FormField label="Shop / Company Name">
            <input className={inputCls} value={supForm.shopName} onChange={(e) => setSupForm((f) => ({ ...f, shopName: e.target.value }))} tabIndex={11} />
          </FormField>
          <FormField label="Phone Number">
            <input
              className={`${inputCls}${supPhoneError ? " border-red-400" : ""}`}
              value={supForm.phone}
              onChange={(e) => { setSupForm((f) => ({ ...f, phone: e.target.value })); setSupPhoneError(""); }}
              placeholder="e.g. 9876543210"
              tabIndex={12}
            />
            {supPhoneError && <p className="text-xs text-red-500 mt-1">{supPhoneError}</p>}
          </FormField>
          <FormField label="Address">
            <input className={inputCls} value={supForm.address} onChange={(e) => setSupForm((f) => ({ ...f, address: e.target.value }))} tabIndex={13} />
          </FormField>
          <FormField label="Email">
            <input className={inputCls} value={supForm.email} onChange={(e) => setSupForm((f) => ({ ...f, email: e.target.value }))} tabIndex={14} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Btn onClick={() => { setShowSupplierForm(false); setEditSupplier(null); }} tabIndex={16}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSaveSupplier} tabIndex={15}>{editSupplier ? "Save Changes" : "Add Supplier"}</Btn>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {payPurchase && <PaymentModal purchase={payPurchase} onClose={() => setPayPurchase(null)} />}
    </div>
  );
}
