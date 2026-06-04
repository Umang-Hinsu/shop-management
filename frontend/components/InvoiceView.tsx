"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bill, fmt, getSanitizedInvoiceTitle } from "@/lib/store";
import { Badge, Btn } from "@/components/ui-shared";
import { Printer } from "lucide-react";

type BillType = "INVOICE" | "CREDIT_MEMO" | "DEBIT_MEMO";

const BILL_TYPE_LABELS: Record<BillType, string> = {
  INVOICE: "Invoice",
  CREDIT_MEMO: "Credit Memo",
  DEBIT_MEMO: "Debit Memo",
};

interface InvoiceViewProps {
  bill: Bill;
  onBack?: () => void;
  showBackBtn?: boolean;
  showPrintBtn?: boolean;
  showPaymentHistory?: boolean;
}

export default function InvoiceView({
  bill,
  onBack,
  showBackBtn = false,
  showPrintBtn = true,
  showPaymentHistory = false,
}: InvoiceViewProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const balance = Math.max(0, bill.grandTotal - bill.paid);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = getSanitizedInvoiceTitle(bill.id, bill.customerName);
    window.print();
    document.title = originalTitle;
  };

  // Reusable invoice layout paper structure
  const invoicePaper = (
    <div
      className="invoice-paper bg-white border border-gray-200 rounded-xl p-6 max-w-[148mm] mx-auto shadow-sm"
      id="invoice-print"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4 border-b-2 border-blue-600 pb-3">
        <div>
          <img
            src="https://ik.imagekit.io/aiuser/Sweta%20Electric/logo.png?updatedAt=1771245308484"
            alt="Sweta Electric Logo"
            className="h-8 w-auto object-contain mb-1.5"
          />
          <div className="text-xs text-gray-500 mt-1">Jamnagar, Gujarat</div>
          <div className="text-xs text-gray-500">Ph: +91-9879176551</div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-gray-800">
            {BILL_TYPE_LABELS[bill.billType] || bill.billType}
          </div>
          <div className="text-sm font-semibold text-blue-600 mt-0.5">{bill.id}</div>
          <div className="text-xs text-gray-500 mt-1">
            Date: {new Date(bill.date).toLocaleDateString("en-IN")}
          </div>
          <div className="text-xs text-gray-400">Bill No. {bill.daySeq}</div>
        </div>
      </div>

      {/* Bill To */}
      <div className="bg-blue-50 rounded px-2 py-1 mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Bill To:
        </span>
        <span className="text-sm font-semibold text-gray-800">
          {bill.customerName}
        </span>
      </div>

      {/* Items table */}
      <table className="w-full text-xs mb-4 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-1.5 text-gray-600 font-semibold">Item</th>
            <th className="text-left py-1.5 text-gray-600 font-semibold text-xs">
              Batch
            </th>
            <th className="text-right py-1.5 text-gray-600 font-semibold w-10">
              Qty
            </th>
            <th className="text-right py-1.5 text-gray-600 font-semibold w-16">
              Rate
            </th>
            <th className="text-right py-1.5 text-gray-600 font-semibold w-16">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1 text-gray-800">{item.name}</td>
              <td className="py-1 text-gray-400 font-mono text-xs">
                {item.batchId}
              </td>
              <td className="py-1 text-right text-gray-600">{item.qty}</td>
              <td className="py-1 text-right text-gray-600">
                {fmt(item.price)}
              </td>
              <td className="py-1 text-right font-medium text-gray-800">
                {fmt(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="ml-auto w-44 space-y-0.5 text-xs">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal</span>
          <span>{fmt(bill.subtotal)}</span>
        </div>
        {bill.discount > 0 && (
          <div className="flex justify-between text-gray-500">
            <span>Discount</span>
            <span>- {fmt(bill.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-800 border-t-2 border-gray-300 pt-1 text-sm mt-1">
          <span>Grand Total</span>
          <span>{fmt(bill.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-gray-500 mt-1">
          <span>Amount Paid</span>
          <span>{fmt(bill.paid)}</span>
        </div>
        <div
          className={`flex justify-between font-semibold ${balance > 0 ? "text-red-600" : "text-emerald-600"
            }`}
        >
          <span>Balance Due</span>
          <span>{fmt(balance)}</span>
        </div>
      </div>

      {bill.note && (
        <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
          <span className="font-medium">Note:</span> {bill.note}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-2">
        <Badge color={bill.status === "PAID" ? "green" : "amber"}>
          {bill.status}
        </Badge>
        <div className="text-xs text-gray-400">
          Thank you for your business!
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Screen view */}
      <div className="print:hidden">
        {/* Actions (print/back buttons) */}
        {(showBackBtn || showPrintBtn) && (
          <div className="flex gap-3 mb-5">
            {showBackBtn && onBack && (
              <Btn onClick={onBack} tabIndex={1}>
                ← New Bill
              </Btn>
            )}
            {showPrintBtn && (
              <Btn variant="primary" onClick={handlePrint} tabIndex={2}>
                <Printer className="w-4 h-4 mr-1.5 inline" /> Print Invoice
              </Btn>
            )}
          </div>
        )}
        {invoicePaper}

        {/* Optional Payment History Log */}
        {showPaymentHistory && bill.payments && bill.payments.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Payment History
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {bill.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-gray-800">
                      {fmt(p.amount)}
                    </span>
                    {p.note && (
                      <span className="text-gray-400 ml-1.5">({p.note})</span>
                    )}
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
          </div>
        )}
      </div>

      {/* Print view rendered at body level to avoid layout wrapper issues */}
      {mounted && createPortal(
        <div className="print-portal-container hidden print:block font-sans">
          {invoicePaper}
        </div>,
        document.body
      )}
    </div>
  );
}
