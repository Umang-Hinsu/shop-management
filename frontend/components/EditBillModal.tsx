"use client";

import { useState, useRef, useEffect } from "react";
import { useApp, fmt, Bill, ProductBatch } from "@/lib/store";
import { Badge, Btn, FormField, Modal, inputCls, selectCls } from "@/components/ui-shared";

type CartItem = {
  productId: number;
  batchId: string;
  name: string;
  price: number;
  qty: number;
  maxQty: number;
};

type BillType = "INVOICE" | "CREDIT_MEMO" | "DEBIT_MEMO";

export default function EditBillModal({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const { products, customers, updateBill } = useApp();

  const [selectedCustomer, setSelectedCustomer] = useState(bill.customerId ? String(bill.customerId) : "walkin");
  const [billType, setBillType] = useState<BillType>(bill.billType);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [discount, setDiscount] = useState(bill.discount);
  const [amountPaid, setAmountPaid] = useState(bill.paid);
  const [billNote, setBillNote] = useState(bill.note ?? "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [qtyModal, setQtyModal] = useState<{ product: ProductBatch; max: number } | null>(null);
  const [qtyInput, setQtyInput] = useState("1");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper to determine the stock available for this product:
  // Current available stock in productBatch + the qty allocated to this item in the old bill.
  const getProductMaxQty = (product: ProductBatch) => {
    const oldItem = bill.items.find((item) => item.productId === product.id);
    return product.qty + (oldItem ? oldItem.qty : 0);
  };

  // Pre-load the cart with existing bill items
  useEffect(() => {
    const initialCart = bill.items.map((item) => {
      // Find matching product in products to check current stock
      const matchingProduct = products.find((p) => p.id === item.productId);
      const currentStock = matchingProduct ? matchingProduct.qty : 0;
      return {
        productId: item.productId,
        batchId: item.batchId,
        name: item.name,
        price: item.price,
        qty: item.qty,
        maxQty: currentStock + item.qty, // current stock + old quantity
      };
    });
    setCart(initialCart);
  }, [bill, products]);

  // Filter products by search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  useEffect(() => {
    if (qtyModal) setTimeout(() => qtyRef.current?.focus(), 50);
  }, [qtyModal]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchProduct]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts[selectedIndex]) {
        requestAddToCart(filteredProducts[selectedIndex]);
      }
    } else if (e.key === "Tab") {
      setShowDropdown(false);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSearchProduct("");
    }
  };

  const requestAddToCart = (product: ProductBatch) => {
    const maxQty = getProductMaxQty(product);
    if (maxQty <= 0) return;
    setQtyModal({ product, max: maxQty });
    setQtyInput("1");
    setShowDropdown(false);
    setSearchProduct("");
  };

  const confirmAddToCart = () => {
    if (!qtyModal) return;
    const qty = Math.min(Math.max(1, Number(qtyInput)), qtyModal.max);
    setCart((c) => {
      const existing = c.find((i) => i.productId === qtyModal.product.id);
      if (existing) {
        return c.map((i) =>
          i.productId === qtyModal.product.id
            ? { ...i, qty: Math.min(i.qty + qty, i.maxQty) }
            : i
        );
      }
      return [
        ...c,
        {
          productId: qtyModal.product.id,
          batchId: qtyModal.product.batchId,
          name: qtyModal.product.name,
          price: qtyModal.product.sellingPrice,
          qty,
          maxQty: qtyModal.max,
        },
      ];
    });
    setQtyModal(null);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty < 1) {
      setCart((c) => c.filter((i) => i.productId !== productId));
      return;
    }
    setCart((c) =>
      c.map((i) => (i.productId === productId ? { ...i, qty: Math.min(qty, i.maxQty) } : i))
    );
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const grandTotal = Math.max(0, subtotal - Number(discount));
  const remaining = Math.max(0, grandTotal - Number(amountPaid));
  const customer = customers.find((c) => c.id === Number(selectedCustomer));

  const handleUpdateBill = async () => {
    if (cart.length === 0) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const updatedData = {
        customerId: selectedCustomer === "walkin" ? null : Number(selectedCustomer),
        customerName: selectedCustomer === "walkin" ? "Walk-in Customer" : (customer?.name || "Walk-in Customer"),
        billType,
        items: cart.map((i) => ({
          productId: i.productId,
          batchId: i.batchId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          total: i.price * i.qty,
        })),
        subtotal,
        discount: Number(discount),
        grandTotal,
        paid: Number(amountPaid),
        date: bill.date, // keep original date
        note: billNote,
      };
      await updateBill(bill.id, updatedData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update invoice");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title={`Edit Invoice: ${bill.id}`} onClose={onClose} width="max-w-4xl">
      {errorMsg && (
        <div className="mb-4 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Left panel */}
        <div className="space-y-4">
          {/* Customer + Bill Type */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Customer">
                <select className={selectCls} value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                  <option value="walkin">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Bill Type">
                <select className={selectCls} value={billType} onChange={(e) => setBillType(e.target.value as BillType)}>
                  <option value="INVOICE">Invoice</option>
                  <option value="CREDIT_MEMO">Credit Memo</option>
                  <option value="DEBIT_MEMO">Debit Memo</option>
                </select>
              </FormField>
            </div>
          </div>

          {/* Product search */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-semibold text-gray-700 mb-3">Add Products</div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
              <input
                ref={searchRef}
                className={`${inputCls} pl-9`}
                placeholder="Type product name, use arrows to select, Enter to add..."
                value={searchProduct}
                onChange={(e) => { setSearchProduct(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
              />
              {showDropdown && searchProduct && (
                <div ref={dropdownRef} className="absolute left-0 right-0 z-10 bg-white mt-1 border border-gray-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto shadow-lg">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">No products found</div>
                  ) : (
                    filteredProducts.map((p, idx) => {
                      const maxQty = getProductMaxQty(p);
                      return (
                        <div
                          key={p.id}
                          className={`flex justify-between items-center px-4 py-2.5 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${
                            maxQty <= 0
                              ? idx === selectedIndex
                                ? "bg-red-100"
                                : "bg-red-50 hover:bg-red-100/70"
                              : idx === selectedIndex
                              ? "bg-blue-100"
                              : "hover:bg-blue-50"
                          }`}
                          onMouseDown={() => requestAddToCart(p)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <div>
                            <div className={`text-sm font-medium ${maxQty <= 0 ? "text-red-700 font-semibold" : "text-gray-800"}`}>
                              {p.name}
                              {maxQty <= 0 && (
                                <span className="text-[10px] font-bold text-red-600 uppercase ml-2 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              Batch: <span className="font-mono text-gray-500">{p.batchId}</span> · Available: <span className={`font-semibold ${maxQty <= 0 ? "text-red-600" : "text-gray-600"}`}>{maxQty}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${maxQty <= 0 ? "text-red-600" : "text-blue-600"}`}>{fmt(p.sellingPrice)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
              Cart ({cart.length} item{cart.length !== 1 ? "s" : ""})
            </div>
            {cart.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No items added yet</div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Product", "Batch", "Rate", "Qty", "Total", ""].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.productId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{item.name}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-gray-500">{item.batchId}</td>
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{fmt(item.price)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(item.productId, item.qty - 1)} className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm">−</button>
                            <input
                              type="number"
                              value={item.qty}
                              min={1}
                              max={item.maxQty}
                              onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                              className="w-12 text-center border border-gray-200 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <button onClick={() => updateQty(item.productId, item.qty + 1)} className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm">+</button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{fmt(item.price * item.qty)}</td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => setCart((c) => c.filter((i) => i.productId !== item.productId))} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-semibold text-gray-700 mb-3">Bill Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Items</span><span className="font-medium text-gray-800">{cart.length}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span className="font-medium text-gray-800">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="flex justify-between font-bold text-gray-800 border-t border-gray-100 pt-2 text-base">
                <span>Grand Total</span><span>{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-semibold text-gray-700 mb-3">Payment</div>
            <FormField label="Amount Paid (₹)">
              <input
                className={inputCls}
                type="number"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
              />
            </FormField>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Balance Due</span>
              <span className={`font-semibold ${remaining > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(remaining)}</span>
            </div>
            <div className="mt-2">
              <Badge color={remaining <= 0 ? "green" : "amber"}>{remaining <= 0 ? "Fully Paid" : "Partial Payment"}</Badge>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <FormField label="Note (optional)">
              <input className={inputCls} value={billNote} onChange={(e) => setBillNote(e.target.value)} placeholder="Any bill note..." />
            </FormField>
          </div>

          <div className="flex gap-2">
            <Btn onClick={onClose} className="w-1/2">
              Cancel
            </Btn>
            <Btn variant="primary" onClick={handleUpdateBill} disabled={cart.length === 0 || isSaving} className="w-1/2">
              {isSaving ? "Saving..." : "Save Changes"}
            </Btn>
          </div>
        </div>
      </div>

      {/* Qty modal */}
      {qtyModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-1">{qtyModal.product.name}</h3>
            <p className="text-xs text-gray-400 mb-4">Batch: {qtyModal.product.batchId} · Max Allowed: {qtyModal.max} · Rate: {fmt(qtyModal.product.sellingPrice)}</p>
            <FormField label="Enter Quantity" required>
              <input
                ref={qtyRef}
                className={inputCls}
                type="number"
                min="1"
                max={qtyModal.max}
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmAddToCart();
                  if (e.key === "Escape") setQtyModal(null);
                }}
              />
            </FormField>
            <div className="flex gap-2 justify-end">
              <Btn onClick={() => setQtyModal(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={confirmAddToCart}>Add to Cart</Btn>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
