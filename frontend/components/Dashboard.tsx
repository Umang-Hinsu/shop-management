"use client";

import { useApp, fmt } from "@/lib/store";
import { StatCard, Badge } from "@/components/ui-shared";

export default function Dashboard({ navigate }: { navigate: (tab: string) => void }) {
  const { products, customers, bills } = useApp();
  const totalBilled = bills.reduce((s, b) => s + b.grandTotal, 0);
  const pendingPayment = customers.reduce((s, c) => s + (c.totalCredit - c.totalPaid), 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Dashboard</h2>
        <p className="text-sm text-gray-500">Sweta Electric — Business Overview</p>
      </div>

      {/* Stats row - Total Bills first, no stock alert, no customers, no products */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Bills" value={bills.length} sub="generated" color="blue" />
        <StatCard label="Total Billed" value={fmt(totalBilled)} sub="all invoices" color="green" />
        <StatCard label="Pending Balance" value={fmt(pendingPayment)} sub="to collect" color="amber" />
      </div>

      {/* Pending payments */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 max-w-2xl shadow-sm">
        <div className="font-semibold text-sm text-gray-700 mb-3">Pending Payments</div>
        {customers.filter((c) => c.totalCredit > c.totalPaid).length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">All payments cleared</p>
        ) : (
          <div className="space-y-0">
            {customers
              .filter((c) => c.totalCredit > c.totalPaid)
              .sort((a, b) => (b.totalCredit - b.totalPaid) - (a.totalCredit - a.totalPaid))
              .slice(0, 8)
              .map((c) => (
                <div key={c.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">{fmt(c.totalCredit - c.totalPaid)}</div>
                    <div className="text-xs text-gray-400">pending</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
