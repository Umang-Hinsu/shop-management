"use client";

import { useState, useRef, useEffect } from "react";
import { useApp, fmt, Customer, Bill, getSanitizedInvoiceTitle } from "@/lib/store";
import { Badge, Modal, StatCard, Btn, FormField, inputCls } from "@/components/ui-shared";
import { X, Search } from "lucide-react";
import InvoiceView from "@/components/InvoiceView";

const BILL_TYPE_LABELS: Record<string, string> = {
  INVOICE: "Invoice",
  CREDIT_MEMO: "Credit Memo",
  DEBIT_MEMO: "Debit Memo",
};

// Opens a clean A5 print view directly in the browser - no blank tab redirect needed


function InvoiceModal({ bill, onClose, onPrint }: { bill: Bill; onClose: () => void; onPrint: () => void }) {
  return (
    <Modal title="Invoice Detail" onClose={onClose} width="max-w-lg">
      <InvoiceView bill={bill} showPrintBtn={false} showPaymentHistory={true} />
      <div className="flex justify-end pt-3 mt-4 border-t border-gray-100">
        <Btn variant="primary" onClick={onPrint}>
          🖨️ Print Invoice
        </Btn>
      </div>
    </Modal>
  );
}

function PaymentModal({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const { addBillPayment } = useApp();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const balance = Math.max(0, bill.grandTotal - bill.paid);

  const handlePay = () => {
    const payAmount = Number(amount);
    if (payAmount <= 0 || payAmount > balance) return;
    // Convert YYYY-MM-DD from date input to full ISO datetime for the backend
    const isoDate = date ? new Date(date + "T00:00:00").toISOString() : new Date().toISOString();
    addBillPayment(bill.id, payAmount, isoDate, note);
    onClose();
  };

  return (
    <Modal title="Record Payment" onClose={onClose}>
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-gray-600">Bill: {bill.id}</div>
        <div className="text-lg font-bold text-gray-800">{fmt(bill.grandTotal)} total</div>
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

function CustomerDetail({ customerId, onBack, onDeleted }: { customerId: number; onBack: () => void; onDeleted: () => void }) {
  const { customers, bills, updateCustomer, addBillPayment, deleteCustomer, deleteBill } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [payBill, setPayBill] = useState<Bill | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [printingBill, setPrintingBill] = useState<Bill | null>(null);
  const [confirmDeleteBill, setConfirmDeleteBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState(false);

  const handleDeleteBill = async () => {
    if (!confirmDeleteBill) return;
    setDeletingBill(true);
    try {
      await deleteBill(confirmDeleteBill.id);
      setConfirmDeleteBill(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete bill");
    } finally {
      setDeletingBill(false);
    }
  };

  useEffect(() => {
    if (printingBill) {
      const timer = setTimeout(() => {
        const originalTitle = document.title;
        document.title = getSanitizedInvoiceTitle(printingBill.id, printingBill.customerName);
        window.print();
        document.title = originalTitle;
        setPrintingBill(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [printingBill]);

  const c = customers.find((x) => x.id === customerId);
  if (!c) return null;

  const cBills = bills.filter((b) => b.customerId === customerId);
  const balance = c.totalCredit - c.totalPaid;

  const openEdit = () => {
    setForm({ name: c.name, phone: c.phone, email: c.email });
    setShowEdit(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    updateCustomer(c.id, { name: form.name, phone: form.phone, email: form.email });
    setShowEdit(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCustomer(c.id);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="print:hidden">
        <div className="flex gap-2 items-center mb-5 flex-wrap">
          <Btn onClick={onBack} tabIndex={1}>← Back</Btn>
          <div className="flex gap-2 ml-auto">
            <Btn onClick={openEdit} tabIndex={2}>Edit Customer</Btn>
            <Btn variant="danger" onClick={() => setConfirmDelete(true)} tabIndex={3}>
              🗑️ Delete Customer
            </Btn>
          </div>
        </div>

        <div className="flex gap-4 items-center mb-5">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700 shrink-0">
            {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{c.name}</h2>
            <div className="text-sm text-gray-400">{c.phone}{c.email ? ` · ${c.email}` : ""}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total Billed" value={fmt(c.totalCredit)} color="blue" />
          <StatCard label="Amount Paid" value={fmt(c.totalPaid)} color="green" />
          <StatCard label="Balance Due" value={fmt(balance)} color={balance > 0 ? "red" : "green"} />
          <StatCard label="Total Bills" value={cBills.length} color="gray" />
        </div>

        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 text-sm font-semibold text-gray-700">Purchase History</div>
          {cBills.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No bills yet</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {["Invoice", "Type", "Date", "Items", "Total", "Paid", "Balance", "Status", ""].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...cBills].reverse().map((b) => {
                    const bal = Math.max(0, b.grandTotal - b.paid);
                    return (
                      <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-blue-600 cursor-pointer hover:underline whitespace-nowrap" onClick={() => setViewBill(b)}>{b.id}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{BILL_TYPE_LABELS[b.billType] || "Invoice"}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{new Date(b.date).toLocaleDateString("en-IN")}</td>
                        <td className="px-3 py-2.5 text-gray-600">{b.items.length}</td>
                        <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{fmt(b.grandTotal)}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{fmt(b.paid)}</td>
                        <td className={`px-3 py-2.5 font-medium whitespace-nowrap ${bal > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(bal)}</td>
                        <td className="px-3 py-2.5"><Badge color={b.status === "PAID" ? "green" : "amber"}>{b.status}</Badge></td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1.5 items-center">
                            <Btn className="!px-2 !py-1 !text-xs whitespace-nowrap" onClick={() => setPrintingBill(b)}>🖨️ Print</Btn>
                            {bal > 0 && (
                              <Btn variant="success" onClick={() => setPayBill(b)} className="!px-2 !py-1 !text-xs whitespace-nowrap">Pay</Btn>
                            )}
                            <Btn variant="danger" className="!px-2 !py-1 !text-xs whitespace-nowrap" onClick={() => setConfirmDeleteBill(b)}>🗑️ Delete</Btn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <Modal title="Edit Customer" onClose={() => setShowEdit(false)}>
          <FormField label="Full Name" required>
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} tabIndex={10} />
          </FormField>
          <FormField label="Phone">
            <input className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} tabIndex={11} />
          </FormField>
          <FormField label="Email">
            <input className={inputCls} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} tabIndex={12} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Btn onClick={() => setShowEdit(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSave}>Save Changes</Btn>
          </div>
        </Modal>
      )}

      {viewBill && (
        <InvoiceModal
          bill={viewBill}
          onClose={() => setViewBill(null)}
          onPrint={() => {
            const originalTitle = document.title;
            document.title = getSanitizedInvoiceTitle(viewBill.id, viewBill.customerName);
            window.print();
            document.title = originalTitle;
          }}
        />
      )}
      {payBill && <PaymentModal bill={payBill} onClose={() => setPayBill(null)} />}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <Modal title="Delete Customer" onClose={() => setConfirmDelete(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete <strong>{c.name}</strong>? This action cannot be undone.
              All bills associated with this customer will also be removed.
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

      {/* Delete bill confirmation dialog */}
      {confirmDeleteBill && (
        <Modal title="Delete Bill" onClose={() => setConfirmDeleteBill(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete bill <strong>{confirmDeleteBill.id}</strong>? This action cannot be undone.
              All items stock will be returned to inventory.
            </p>
            {confirmDeleteBill.paid > 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 p-3 rounded-lg font-medium">
                ⚠️ Warning: This bill has payments recorded (totaling {fmt(confirmDeleteBill.paid)}). Deleting it will reverse these payments and adjust the customer's total paid amount.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setConfirmDeleteBill(null)}>Cancel</Btn>
              <Btn variant="danger" onClick={handleDeleteBill} disabled={deletingBill}>
                {deletingBill ? "Deleting..." : "Yes, Delete"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Hidden container for printing invoice in CustomerDetail */}
      {printingBill && (
        <div className="hidden print:block">
          <InvoiceView bill={printingBill} showPrintBtn={false} />
        </div>
      )}
    </div>
  );
}

export default function Customers() {
  const { customers, addCustomer, updateCustomer } = useApp();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [phoneError, setPhoneError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAdd) setTimeout(() => nameRef.current?.focus(), 50);
  }, [showAdd]);

  const pending = customers.filter((c) => c.totalCredit > c.totalPaid);
  const pendingTotal = pending.reduce((s, c) => s + c.totalCredit - c.totalPaid, 0);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({ name: "", phone: "", email: "" });
    setEditCustomer(null);
    setShowAdd(true);
  };

  const openEdit = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setForm({ name: c.name, phone: c.phone, email: c.email });
    setEditCustomer(c);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (form.phone && form.phone.length < 10) {
      setPhoneError("Phone must be at least 10 digits");
      return;
    }
    setPhoneError("");
    if (editCustomer) updateCustomer(editCustomer.id, { name: form.name, phone: form.phone, email: form.email });
    else addCustomer(form);
    setShowAdd(false);
  };

  if (selected !== null) return <CustomerDetail customerId={selected} onBack={() => setSelected(null)} onDeleted={() => setSelected(null)} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-0.5">Customers</h2>
          <p className="text-sm text-gray-500">{customers.length} registered customers</p>
        </div>
        <Btn variant="primary" onClick={openAdd} tabIndex={1}>+ Add Customer</Btn>
      </div>

      {/* Pending payments summary */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pending Payments</div>
          <div className="text-sm font-bold text-amber-800">{pending.length} customer{pending.length !== 1 ? "s" : ""} · {fmt(pendingTotal)} outstanding</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className={`${inputCls} pl-9 pr-9`}
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          tabIndex={2}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {["Customer", "Phone", "Email", "Total Billed", "Paid", "Balance"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const balance = c.totalCredit - c.totalPaid;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => setSelected(c.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                          {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 whitespace-nowrap">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.phone}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{c.email}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{fmt(c.totalCredit)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(c.totalPaid)}</td>
                    <td className={`px-4 py-3 font-semibold whitespace-nowrap ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {balance > 0 ? fmt(balance) : <Badge color="green">Cleared</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="py-10 text-center text-sm text-gray-400">No customers found</div>}
      </div>

      {showAdd && (
        <Modal title={editCustomer ? "Edit Customer" : "Add Customer"} onClose={() => setShowAdd(false)}>
          <FormField label="Full Name" required>
            <input ref={nameRef} className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} tabIndex={10} />
          </FormField>
          <FormField label="Phone Number">
            <input
              className={`${inputCls}${phoneError ? " border-red-400" : ""}`}
              value={form.phone}
              onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); setPhoneError(""); }}
              placeholder="e.g. 9876543210"
              tabIndex={11}
            />
            {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
          </FormField>
          <FormField label="Email Address">
            <input className={inputCls} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} tabIndex={12} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Btn onClick={() => setShowAdd(false)} tabIndex={14}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSave} tabIndex={13}>{editCustomer ? "Save Changes" : "Add Customer"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
