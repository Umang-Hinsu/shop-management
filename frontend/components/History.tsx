"use client";
 
import { useState } from "react";
import { useApp, fmt, Bill } from "@/lib/store";
import { Badge, Btn, FormField, Modal, inputCls, selectCls } from "@/components/ui-shared";
import { Search, Eye, Printer, Calendar, RefreshCw } from "lucide-react";
import InvoiceView from "@/components/InvoiceView";
 
const BILL_TYPE_LABELS: Record<string, string> = {
  INVOICE: "Invoice",
  CREDIT_MEMO: "Credit Memo",
  DEBIT_MEMO: "Debit Memo",
};
 
const BILL_TYPE_COLORS: Record<string, "blue" | "red" | "amber" | "gray"> = {
  INVOICE: "blue",
  CREDIT_MEMO: "red",
  DEBIT_MEMO: "amber",
};
 
export default function History() {
  const { bills, addBillPayment, loading } = useApp();
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
 
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
 
  // Payment Form States
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentNote, setPaymentNote] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
 
  // Selected Bill Lookup
  const selectedBill = bills.find((b) => b.id === selectedBillId) || null;
  const balance = selectedBill ? Math.max(0, selectedBill.grandTotal - selectedBill.paid) : 0;
 
  // Filter & Sort Invoices (Newest first)
  const filteredBills = [...bills]
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.id.localeCompare(a.id);
    })
    .filter((b) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        b.id.toLowerCase().includes(query) ||
        b.customerName.toLowerCase().includes(query);
 
      // Type match
      const matchesType = typeFilter === "ALL" || b.billType === typeFilter;
 
      // Status match
      const matchesStatus = statusFilter === "ALL" || b.status.toUpperCase() === statusFilter.toUpperCase();
 
      // Date match
      let matchesDate = true;
      if (dateFilter !== "ALL") {
        const billDate = new Date(b.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
 
        if (dateFilter === "TODAY") {
          const checkDate = new Date(b.date);
          matchesDate = checkDate.toDateString() === new Date().toDateString();
        } else if (dateFilter === "WEEK") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          matchesDate = billDate >= sevenDaysAgo;
        } else if (dateFilter === "MONTH") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          matchesDate = billDate >= thirtyDaysAgo;
        }
      }
 
      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
 
  // Totals of filtered list
  const filteredTotalAmount = filteredBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const filteredTotalPaid = filteredBills.reduce((sum, b) => sum + b.paid, 0);
  const filteredTotalBalance = Math.max(0, filteredTotalAmount - filteredTotalPaid);
 
  const handleOpenBill = (billId: string) => {
    setSelectedBillId(billId);
    setPaymentAmount("");
    setPaymentNote("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentError(null);
  };
 
  const handleRecordPayment = async () => {
    if (!selectedBillId || !paymentAmount) return;
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      setPaymentError(`Please enter a valid amount between 0 and ${fmt(balance)}`);
      return;
    }
 
    setIsSavingPayment(true);
    setPaymentError(null);
    try {
      const isoDate = paymentDate ? new Date(paymentDate + "T00:00:00").toISOString() : new Date().toISOString();
      await addBillPayment(selectedBillId, amount, isoDate, paymentNote);
      setPaymentAmount("");
      setPaymentNote("");
    } catch (err: any) {
      setPaymentError(err.message || "Failed to record payment");
    } finally {
      setIsSavingPayment(false);
    }
  };
 
  return (
    <div>
      <div className="mb-6 flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-0.5">Invoice History</h2>
          <p className="text-sm text-gray-500">View and manage all generated customer receipts</p>
        </div>
      </div>
 
      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-400 mb-1">Filtered Invoices Count</div>
          <div className="text-2xl font-bold text-gray-800">{filteredBills.length}</div>
          <div className="text-xs text-gray-400 mt-1">out of {bills.length} total</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-400 mb-1">Filtered Total Billed</div>
          <div className="text-2xl font-bold text-blue-600">{fmt(filteredTotalAmount)}</div>
          <div className="text-xs text-emerald-600 mt-1">Paid: {fmt(filteredTotalPaid)}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-400 mb-1">Filtered Pending Balance</div>
          <div className="text-2xl font-bold text-amber-600">{fmt(filteredTotalBalance)}</div>
          <div className="text-xs text-gray-400 mt-1">outstanding credit</div>
        </div>
      </div>
 
      {/* Search & Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6 shadow-sm print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Bill ID or Customer Name..."
              className={`${inputCls} pl-9`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
 
          {/* Bill Type Filter */}
          <div>
            <select
              className={selectCls}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="INVOICE">Invoice</option>
              <option value="CREDIT_MEMO">Credit Memo</option>
              <option value="DEBIT_MEMO">Debit Memo</option>
            </select>
          </div>
 
          {/* Status Filter */}
          <div>
            <select
              className={selectCls}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
 
          {/* Date Filter */}
          <div>
            <select
              className={selectCls}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>
 
      {/* Invoices Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden print:hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-2 text-blue-500" />
            <p className="text-sm">Loading invoices...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">
            No invoices found matching current filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Paid</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Due</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBills.map((b) => {
                  const due = Math.max(0, b.grandTotal - b.paid);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-mono font-medium text-blue-600 text-xs">{b.id}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {new Date(b.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-3 text-gray-800 font-medium text-xs">{b.customerName}</td>
                      <td className="px-5 py-3">
                        <Badge color={BILL_TYPE_COLORS[b.billType] || "gray"}>
                          {BILL_TYPE_LABELS[b.billType] || b.billType}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-800 text-xs">{fmt(b.grandTotal)}</td>
                      <td className="px-5 py-3 text-right text-emerald-600 text-xs">{fmt(b.paid)}</td>
                      <td className="px-5 py-3 text-right text-xs font-medium text-red-500">
                        {due > 0 ? fmt(due) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={b.status.toUpperCase() === "PAID" ? "green" : "amber"}>
                          {b.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Btn
                          onClick={() => handleOpenBill(b.id)}
                          className="!py-1.5 !px-2.5 text-xs text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" /> View
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
 
      {/* Detail Modal */}
      {selectedBill && (
        <Modal
          title={`Invoice Details: ${selectedBill.id}`}
          onClose={() => setSelectedBillId(null)}
          width="max-w-2xl"
        >
          <InvoiceView bill={selectedBill} showPrintBtn={true} />
 
          {/* Payment Log History */}
          <div className="mt-5 pt-4 border-t border-gray-100 print:hidden">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h4>
            {selectedBill.payments && selectedBill.payments.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {selectedBill.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-gray-800">{fmt(p.amount)}</span>
                      {p.note && <span className="text-gray-400 ml-1.5">({p.note})</span>}
                    </div>
                    <div className="text-gray-400">
                      {new Date(p.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No payments have been recorded for this bill.</p>
            )}
          </div>
 
          {/* Payment collection form */}
          {balance > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100 bg-amber-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl print:hidden">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">
                Record New Payment
              </h4>
              {paymentError && (
                <div className="mb-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  {paymentError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <FormField label="Amount Received (₹)">
                  <input
                    type="number"
                    className={inputCls}
                    value={paymentAmount}
                    max={balance}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Amount to pay"
                  />
                </FormField>
                <FormField label="Payment Date">
                  <input
                    type="date"
                    className={inputCls}
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Note / Reference (optional)">
                <input
                  type="text"
                  className={inputCls}
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g., GPay, Cash, Cheque #"
                />
              </FormField>
              <Btn
                variant="primary"
                className="w-full bg-emerald-600 border-emerald-700 hover:bg-emerald-700 focus:ring-emerald-400 text-white mt-2"
                disabled={isSavingPayment || !paymentAmount || Number(paymentAmount) <= 0}
                onClick={handleRecordPayment}
              >
                {isSavingPayment ? "Recording Payment..." : "Record Payment"}
              </Btn>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
