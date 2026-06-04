"use client";

import { useState, useRef, useEffect } from "react";
import { useApp, fmt, ProductBatch } from "@/lib/store";
import { Badge, Modal, StatCard, Btn, FormField, inputCls } from "@/components/ui-shared";

type Form = {
  name: string;
  costPrice: string;
  sellingPrice: string;
  qty: string;
  minStock: string;
  batchId?: string;
};

export default function Inventory() {
  const { products, addProductBatch, updateProductBatch, deleteProductBatch } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<ProductBatch | null>(null);
  const [form, setForm] = useState<Form>({ name: "", costPrice: "", sellingPrice: "", qty: "", minStock: "", batchId: "" });
  const nameRef = useRef<HTMLInputElement>(null);

  // Group products by name, showing all batches separately (old/new price)
  const groupedProducts = products.reduce((acc, p) => {
    const key = p.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, ProductBatch[]>);

  const filteredNames = Object.keys(groupedProducts).filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (showAdd) setTimeout(() => nameRef.current?.focus(), 50);
  }, [showAdd]);

  const openAdd = () => {
    setForm({ name: "", costPrice: "", sellingPrice: "", qty: "", minStock: "", batchId: "" });
    setEditItem(null);
    setShowAdd(true);
  };

  const openEdit = (p: ProductBatch) => {
    setForm({ name: p.name, costPrice: String(p.costPrice), sellingPrice: String(p.sellingPrice), qty: String(p.qty), minStock: String(p.minStock), batchId: p.batchId });
    setEditItem(p);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!form.name || !form.sellingPrice) return;
    const customBatchId = form.batchId?.trim() || `B${Date.now().toString(36).toUpperCase()}`;
    const data: Omit<ProductBatch, "id"> = {
      name: form.name,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      qty: Number(form.qty),
      minStock: Number(form.minStock),
      batchId: customBatchId,
      receivedDate: new Date().toISOString(),
    };
    if (editItem) updateProductBatch(editItem.id, data);
    else addProductBatch(data);
    setShowAdd(false);
  };

  const totalValue = products.reduce((s, p) => s + p.qty * p.costPrice, 0);
  const lowCount = products.filter((p) => p.qty <= p.minStock).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-0.5">Inventory</h2>
          <p className="text-sm text-gray-500">{products.length} batches · Stock value {fmt(totalValue)}</p>
        </div>
        <Btn variant="primary" onClick={openAdd} tabIndex={1}>+ Add Product</Btn>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Batches" value={products.length} color="blue" />
        <StatCard label="Stock Value" value={fmt(totalValue)} color="green" />
        <StatCard label="Low Stock" value={lowCount} sub="need restock" color={lowCount > 0 ? "red" : "green"} />
        <StatCard label="Products" value={Object.keys(groupedProducts).length} sub="unique names" color="gray" />
      </div>

      <div className="mb-4 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
        <input
          className={`${inputCls} pl-9`}
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          tabIndex={2}
        />
      </div>

      {/* Products grouped by name, showing all batches */}
      <div className="space-y-3">
        {filteredNames.map((name) => {
          const batches = groupedProducts[name].sort((a, b) => b.receivedDate.localeCompare(a.receivedDate));
          const totalQty = batches.reduce((s, b) => s + b.qty, 0);
          return (
            <div key={name} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{name}</span>
                </div>
                <span className="text-sm text-gray-600">{totalQty} units total across {batches.length} batch{batches.length > 1 ? "es" : ""}</span>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">Batch</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">Cost Price</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">Selling Price</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">Stock</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">Min Stock</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">Received</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((p, idx) => {
                      const low = p.qty <= p.minStock;
                      return (
                        <tr key={p.id} className={`border-b border-gray-55 hover:bg-gray-50/50 transition-colors ${low ? "bg-red-50/30" : ""}`}>
                          <td className="px-4 py-2.5 text-xs font-mono text-gray-500">{p.batchId}</td>
                          <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{fmt(p.costPrice)}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{fmt(p.sellingPrice)}</td>
                          <td className={`px-4 py-2.5 font-semibold ${low ? "text-red-600" : "text-gray-800"}`}>{p.qty}</td>
                          <td className="px-4 py-2.5 text-gray-400">{p.minStock}</td>
                          <td className="px-4 py-2.5"><Badge color={low ? "red" : "green"}>{low ? "Low" : "OK"}</Badge></td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{p.receivedDate}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-2">
                              <Btn onClick={() => openEdit(p)} className="!px-2 !py-1 !text-xs whitespace-nowrap">Edit</Btn>
                              <Btn variant="danger" onClick={() => deleteProductBatch(p.id)} className="!px-2 !py-1 !text-xs whitespace-nowrap">Del</Btn>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        {filteredNames.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">No products found</div>
        )}
      </div>

      {showAdd && (
        <Modal title={editItem ? "Edit Product Batch" : "Add Product Batch"} onClose={() => setShowAdd(false)} width="max-w-lg">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <FormField label="Product Name" required>
              <input
                ref={nameRef}
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. LED Bulb 9W"
                tabIndex={10}
              />
            </FormField>
            <FormField label="Batch Number">
              <input
                className={`${inputCls} font-mono`}
                value={form.batchId}
                onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
                placeholder="Auto-generated if blank"
                disabled={!!editItem}
                tabIndex={11}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cost Price (₹)">
              <input className={inputCls} type="number" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} tabIndex={12} />
            </FormField>
            <FormField label="Selling Price (₹)" required>
              <input className={inputCls} type="number" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} tabIndex={13} />
            </FormField>
            <FormField label="Current Stock Qty">
              <input className={inputCls} type="number" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} tabIndex={14} />
            </FormField>
            <FormField label="Min Stock Level">
              <input className={inputCls} type="number" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))} tabIndex={15} />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Btn onClick={() => setShowAdd(false)} tabIndex={17}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSave} tabIndex={16}>{editItem ? "Save Changes" : "Add Product"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
