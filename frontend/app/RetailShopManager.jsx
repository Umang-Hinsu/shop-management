import { useState } from "react";
import { AppProvider, useApp, fmt } from "../lib/store";


function Badge({ children, color = "gray" }) {
  const colors = {
    green: { bg: "#EAF3DE", text: "#3B6D11" },
    red: { bg: "#FCEBEB", text: "#A32D2D" },
    amber: { bg: "#FAEEDA", text: "#854F0B" },
    blue: { bg: "#E6F1FB", text: "#185FA5" },
    gray: { bg: "#F1EFE8", text: "#5F5E5A" },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, display: "inline-block" }}>
      {children}
    </span>
  );
}

function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", border: "0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--color-text-secondary)", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>{label}</label>}
      <input style={{ width: "100%", boxSizing: "border-box" }} {...props} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>{label}</label>}
      <select style={{ width: "100%", boxSizing: "border-box" }} {...props}>{children}</select>
    </div>
  );
}

function Btn({ children, onClick, variant = "default", style: s = {}, disabled }) {
  const styles = {
    default: {},
    primary: { background: "#185FA5", color: "#fff", borderColor: "#185FA5" },
    danger: { background: "#FCEBEB", color: "#A32D2D", borderColor: "#F09595" },
    success: { background: "#EAF3DE", color: "#3B6D11", borderColor: "#97C459" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...styles[variant], ...s, opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

function StatCard({ label, value, sub, color = "blue" }) {
  const colors = { blue: "#E6F1FB", green: "#EAF3DE", amber: "#FAEEDA", red: "#FCEBEB", purple: "#EEEDFE" };
  return (
    <div style={{ background: colors[color], borderRadius: 12, padding: "16px 20px", minWidth: 0 }}>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Dashboard({ navigate }) {
  const { products, customers, bills, purchases } = useApp();
  const lowStock = products.filter(p => p.qty <= p.minStock);
  const totalRevenue = bills.reduce((s, b) => s + b.grandTotal, 0);
  const totalPaid = bills.reduce((s, b) => s + b.paid, 0);
  const pendingPayment = customers.reduce((s, c) => s + (c.totalCredit - c.totalPaid), 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Dashboard</h2>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Overview of your retail operations</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label="Total Products" value={products.length} sub={`${lowStock.length} low stock`} color="blue" />
        <StatCard label="Total Customers" value={customers.length} sub="registered" color="purple" />
        <StatCard label="Revenue (Billed)" value={fmt(totalRevenue)} sub="all time" color="green" />
        <StatCard label="Pending Balance" value={fmt(pendingPayment)} sub="to collect" color="amber" />
        <StatCard label="Total Bills" value={bills.length} sub="generated" color="blue" />
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16, color: "#A32D2D" }}>⚠</span>
            <span style={{ fontWeight: 500, color: "#A32D2D", fontSize: 14 }}>Low Stock Alert — {lowStock.length} product{lowStock.length > 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {lowStock.map(p => (
              <div key={p.id} style={{ background: "#fff", border: "0.5px solid #F09595", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                <span style={{ color: "#A32D2D", marginLeft: 8 }}>{p.qty} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 500, marginBottom: 14, fontSize: 14 }}>Recent Bills</div>
          {bills.slice(-4).reverse().map(b => (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{b.id}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{b.customerName}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{fmt(b.grandTotal)}</div>
                <Badge color={b.status === "Paid" ? "green" : "amber"}>{b.status}</Badge>
              </div>
            </div>
          ))}
          {bills.length === 0 && <div style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>No bills yet</div>}
        </div>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 500, marginBottom: 14, fontSize: 14 }}>Top Customers</div>
          {[...customers].sort((a, b) => b.totalCredit - a.totalCredit).slice(0, 4).map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{c.phone}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13 }}>{fmt(c.totalCredit)}</div>
                <div style={{ fontSize: 11, color: c.totalCredit > c.totalPaid ? "#A32D2D" : "#3B6D11" }}>
                  {c.totalCredit > c.totalPaid ? `${fmt(c.totalCredit - c.totalPaid)} due` : "Cleared"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Inventory() {
  const { products, addProductBatch, updateProductBatch, deleteProductBatch, loading, error } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", costPrice: "", sellingPrice: "", qty: "", minStock: "" });

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({ name: "", category: "", costPrice: "", sellingPrice: "", qty: "", minStock: "" }); setEditItem(null); setShowAdd(true); };
  const openEdit = (p) => { setForm({ name: p.name, category: p.category, costPrice: p.costPrice, sellingPrice: p.sellingPrice, qty: p.qty, minStock: p.minStock }); setEditItem(p); setShowAdd(true); };

  const handleSave = async () => {
    if (!form.name || !form.sellingPrice) return;
    const batchId = `B${Date.now()}`;
    const data = { batchId, name: form.name, category: form.category || "Other", costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice), qty: Number(form.qty), minStock: Number(form.minStock), receivedDate: new Date().toISOString() };
    if (editItem) await updateProductBatch(editItem.id, data);
    else await addProductBatch(data);
    setShowAdd(false);
  };

  const totalValue = products.reduce((s, p) => s + p.qty * p.costPrice, 0);
  const lowCount = products.filter(p => p.qty <= p.minStock).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Inventory</h2>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{products.length} products · Stock value {fmt(totalValue)}</div>
        </div>
        <Btn variant="primary" onClick={openAdd}>+ Add Product</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Products" value={products.length} color="blue" />
        <StatCard label="Stock Value" value={fmt(totalValue)} color="green" />
        <StatCard label="Low Stock" value={lowCount} sub="need restock" color={lowCount > 0 ? "red" : "green"} />
        <StatCard label="Categories" value={[...new Set(products.map(p => p.category))].length} color="purple" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <input placeholder="Search products or categories…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
      </div>

      <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              {["Product", "Category", "Stock", "Cost", "Selling", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const lowStock = p.qty <= p.minStock;
              return (
                <tr key={p.id} style={{ background: lowStock ? "#FFF5F5" : "transparent", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}><Badge>{p.category}</Badge></td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, color: lowStock ? "#A32D2D" : "var(--color-text-primary)" }}>{p.qty}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--color-text-secondary)" }}>{fmt(p.costPrice)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>{fmt(p.sellingPrice)}</td>
                  <td style={{ padding: "10px 14px" }}><Badge color={lowStock ? "red" : "green"}>{lowStock ? "Low Stock" : "OK"}</Badge></td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(p)} style={{ fontSize: 12, padding: "4px 10px" }}>Edit</button>
                      <Btn variant="danger" onClick={() => deleteProductBatch(p.id)} style={{ fontSize: 12, padding: "4px 10px" }}>Delete</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>No products found</div>
        )}
      </div>

      {showAdd && (
        <Modal title={editItem ? "Edit Product" : "Add Product"} onClose={() => setShowAdd(false)}>
          <Input label="Product Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Basmati Rice 5kg" />
          <Input label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Grains" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Cost Price (₹)" type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} />
            <Input label="Selling Price (₹) *" type="number" value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))} />
            <Input label="Current Stock Qty" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
            <Input label="Min Stock Level" type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button onClick={() => setShowAdd(false)}>Cancel</button>
            <Btn variant="primary" onClick={handleSave}>{editItem ? "Save Changes" : "Add Product"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Billing() {
  const { products, customers, addBill, loading } = useApp();
  const [selectedCustomer, setSelectedCustomer] = useState("walkin");
  const [cart, setCart] = useState([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [showInvoice, setShowInvoice] = useState(null);
  const [billNote, setBillNote] = useState("");

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) && p.qty > 0
  );

  const addToCart = (product) => {
    setCart(c => {
      const existing = c.find(i => i.productId === product.id);
      if (existing) return c.map(i => i.productId === product.id ? { ...i, qty: Math.min(i.qty + 1, product.qty) } : i);
      return [...c, { productId: product.id, name: product.name, price: product.sellingPrice, qty: 1, maxQty: product.qty }];
    });
    setSearchProduct("");
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) { setCart(c => c.filter(i => i.productId !== productId)); return; }
    setCart(c => c.map(i => i.productId === productId ? { ...i, qty: Math.min(qty, i.maxQty) } : i));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const grandTotal = Math.max(0, subtotal - Number(discount));
  const remaining = Math.max(0, grandTotal - Number(amountPaid));
  const customer = customers.find(c => c.id === Number(selectedCustomer));

  const handleSaveBill = async () => {
    if (cart.length === 0) return;
    const today = new Date().toISOString();
    const bill = {
      customerId: selectedCustomer === "walkin" ? null : Number(selectedCustomer),
      customerName: selectedCustomer === "walkin" ? "Walk-in Customer" : customer?.name,
      billType: "INVOICE",
      items: cart.map(i => ({ productId: i.productId, batchId: i.batchId || String(i.productId), name: i.name, price: i.price, qty: i.qty, total: i.price * i.qty })),
      subtotal,
      discount: Number(discount),
      grandTotal,
      paid: Number(amountPaid),
      status: remaining <= 0 ? "PAID" : Number(amountPaid) > 0 ? "PARTIAL" : "UNPAID",
      date: today,
      note: billNote,
      daySeq: 1,
    };
    const id = await addBill(bill);
    setShowInvoice({ ...bill, id, date: today.split("T")[0] });
    setCart([]);
    setDiscount(0);
    setAmountPaid(0);
    setBillNote("");
    setSelectedCustomer("walkin");
  };

  if (showInvoice) {
    return (
      <div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setShowInvoice(null)}>← New Bill</button>
          <Btn variant="primary" onClick={() => window.print()}>🖨 Print Invoice</Btn>
        </div>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 32, maxWidth: 600 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 500, color: "#185FA5" }}>INVOICE</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>{showInvoice.id}</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 13, color: "var(--color-text-secondary)" }}>
              <div style={{ fontWeight: 500, color: "var(--color-text-primary)", fontSize: 15 }}>My Retail Shop</div>
              <div>Jamnagar, Gujarat</div>
              <div>Date: {showInvoice.date}</div>
            </div>
          </div>
          <div style={{ marginBottom: 20, padding: 12, background: "#E6F1FB", borderRadius: 8 }}>
            <div style={{ fontWeight: 500, fontSize: 14 }}>Bill To:</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{showInvoice.customerName}</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>
                <th style={{ padding: "8px 4px", textAlign: "left" }}>Item</th>
                <th style={{ padding: "8px 4px", textAlign: "right" }}>Qty</th>
                <th style={{ padding: "8px 4px", textAlign: "right" }}>Price</th>
                <th style={{ padding: "8px 4px", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {showInvoice.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <td style={{ padding: "8px 4px" }}>{item.name}</td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>{item.qty}</td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>{fmt(item.price)}</td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginLeft: "auto", width: 220, fontSize: 13 }}>
            {[["Subtotal", fmt(showInvoice.subtotal)], ["Discount", `- ${fmt(showInvoice.discount)}`], ["Grand Total", fmt(showInvoice.grandTotal)], ["Amount Paid", fmt(showInvoice.paid)], ["Balance Due", fmt(Math.max(0, showInvoice.grandTotal - showInvoice.paid))]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: l === "Grand Total" ? "2px solid var(--color-border-tertiary)" : "0.5px solid var(--color-border-tertiary)", fontWeight: l === "Grand Total" ? 500 : 400 }}>
                <span>{l}</span><span>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <Badge color={showInvoice.status === "Paid" ? "green" : "amber"}>{showInvoice.status}</Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>New Bill / POS</h2>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Create and manage customer invoices</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div>
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Customer</div>
            <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} style={{ width: "100%" }}>
              <option value="walkin">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>

          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Add Products</div>
            <input placeholder="Search product to add…" value={searchProduct} onChange={e => setSearchProduct(e.target.value)} style={{ width: "100%", boxSizing: "border-box", marginBottom: 8 }} />
            {searchProduct && (
              <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={() => addToCart(p)} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--color-background-secondary)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--color-background-primary)"}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Stock: {p.qty} | {p.category}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#185FA5" }}>{fmt(p.sellingPrice)}</div>
                  </div>
                ))}
                {filteredProducts.length === 0 && <div style={{ padding: 12, fontSize: 13, color: "var(--color-text-secondary)" }}>No products found</div>}
              </div>
            )}
          </div>

          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13, fontWeight: 500 }}>Cart ({cart.length} items)</div>
            {cart.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>No items added yet</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--color-background-secondary)" }}>
                    {["Product", "Price", "Qty", "Total", ""].map(h => (
                      <th key={h} style={{ padding: "8px 14px", fontSize: 12, textAlign: "left", color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.productId} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>{item.name}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13 }}>{fmt(item.price)}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button onClick={() => updateQty(item.productId, item.qty - 1)} style={{ padding: "2px 8px", fontSize: 14 }}>−</button>
                          <span style={{ fontSize: 13, minWidth: 24, textAlign: "center" }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.productId, item.qty + 1)} style={{ padding: "2px 8px", fontSize: 14 }}>+</button>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>{fmt(item.price * item.qty)}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <button onClick={() => setCart(c => c.filter(i => i.productId !== item.productId))} style={{ fontSize: 12, color: "#A32D2D", border: "none", background: "none", cursor: "pointer" }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Bill Summary</div>
            {[["Items", cart.length], ["Subtotal", fmt(subtotal)], ["Discount (₹)", null], ["Grand Total", fmt(grandTotal)]].map(([l, v]) => (
              <div key={l}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: l === "Discount (₹)" ? 4 : 10 }}>
                  <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{l}</span>
                  {v !== null ? (
                    <span style={{ fontSize: 13, fontWeight: l === "Grand Total" ? 500 : 400 }}>{v}</span>
                  ) : (
                    <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} style={{ width: 90, textAlign: "right", padding: "4px 8px" }} />
                  )}
                </div>
                {l === "Grand Total" && <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", margin: "10px 0" }} />}
              </div>
            ))}
          </div>

          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Payment</div>
            <Input label="Amount Paid (₹)" type="number" min="0" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 8 }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Balance Due</span>
              <span style={{ fontWeight: 500, color: remaining > 0 ? "#A32D2D" : "#3B6D11" }}>{fmt(remaining)}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <Badge color={remaining <= 0 ? "green" : "amber"}>{remaining <= 0 ? "Fully Paid" : "Partial Payment"}</Badge>
            </div>
          </div>

          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 20 }}>
            <Input label="Note (optional)" value={billNote} onChange={e => setBillNote(e.target.value)} placeholder="Any bill note…" />
          </div>

          <Btn variant="primary" onClick={handleSaveBill} disabled={cart.length === 0} style={{ width: "100%", padding: "12px", fontSize: 14 }}>
            Save & Generate Invoice
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Customers() {
  const { customers, bills, addCustomer, updateCustomer, loading, error } = useApp();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerBills = (id) => bills.filter(b => b.customerId === id);

  const mvp = customers.reduce((best, c) => (!best || c.totalCredit > best.totalCredit) ? c : best, null);
  const pending = customers.filter(c => c.totalCredit > c.totalPaid);

  const openAdd = () => { setForm({ name: "", phone: "", email: "" }); setEditCustomer(null); setShowAdd(true); };
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone, email: c.email }); setEditCustomer(c); setShowAdd(true); };

  const handleSave = async () => {
    if (!form.name) return;
    if (editCustomer) await updateCustomer(editCustomer.id, { name: form.name, phone: form.phone, email: form.email });
    else await addCustomer({ name: form.name, phone: form.phone, email: form.email || undefined });
    setShowAdd(false);
  };

  if (selected) {
    const c = customers.find(x => x.id === selected);
    const cBills = getCustomerBills(c.id);
    const balance = c.totalCredit - c.totalPaid;
    return (
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }}>
          <button onClick={() => setSelected(null)}>← Back</button>
          <button onClick={() => openEdit(c)}>Edit Customer</button>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 500, color: "#185FA5", flexShrink: 0 }}>
            {c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{c.name}</h2>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{c.phone} · {c.email}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, margin: "20px 0" }}>
          <StatCard label="Total Billed" value={fmt(c.totalCredit)} color="blue" />
          <StatCard label="Amount Paid" value={fmt(c.totalPaid)} color="green" />
          <StatCard label="Balance Due" value={fmt(balance)} color={balance > 0 ? "red" : "green"} />
          <StatCard label="Total Bills" value={cBills.length} color="purple" />
        </div>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13, fontWeight: 500 }}>Purchase History</div>
          {cBills.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>No bills yet</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-background-secondary)" }}>
                  {["Invoice", "Date", "Items", "Grand Total", "Paid", "Balance", "Status"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", fontSize: 12, textAlign: "left", color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cBills.map(b => (
                  <tr key={b.id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#185FA5" }}>{b.id}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{b.date}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{b.items.length}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>{fmt(b.grandTotal)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{fmt(b.paid)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: b.grandTotal - b.paid > 0 ? "#A32D2D" : "#3B6D11" }}>{fmt(Math.max(0, b.grandTotal - b.paid))}</td>
                    <td style={{ padding: "10px 14px" }}><Badge color={b.status === "Paid" ? "green" : "amber"}>{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {showAdd && (
          <Modal title="Edit Customer" onClose={() => setShowAdd(false)}>
            <Input label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowAdd(false)}>Cancel</button>
              <Btn variant="primary" onClick={handleSave}>Save Changes</Btn>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Customers</h2>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{customers.length} registered customers</div>
        </div>
        <Btn variant="primary" onClick={openAdd}>+ Add Customer</Btn>
      </div>

      {mvp && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#EEEDFE", border: "0.5px solid #AFA9EC", borderRadius: 12, padding: "14px 20px", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 24 }}>🏆</span>
            <div>
              <div style={{ fontSize: 12, color: "#534AB7" }}>Most Valuable Customer</div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{mvp.name}</div>
              <div style={{ fontSize: 12, color: "#534AB7" }}>Total billed: {fmt(mvp.totalCredit)}</div>
            </div>
          </div>
          <div style={{ background: "#FAEEDA", border: "0.5px solid #EF9F27", borderRadius: 12, padding: "14px 20px", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 24 }}>⏳</span>
            <div>
              <div style={{ fontSize: 12, color: "#854F0B" }}>Pending Payments</div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{pending.length} customer{pending.length !== 1 ? "s" : ""}</div>
              <div style={{ fontSize: 12, color: "#854F0B" }}>{fmt(pending.reduce((s, c) => s + c.totalCredit - c.totalPaid, 0))} outstanding</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <input placeholder="Search by name, phone, or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
      </div>

      <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              {["Customer", "Phone", "Email", "Total Billed", "Paid", "Balance", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const balance = c.totalCredit - c.totalPaid;
              return (
                <tr key={c.id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", cursor: "pointer" }}
                  onClick={() => setSelected(c.id)}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--color-background-secondary)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "#185FA5", flexShrink: 0 }}>
                        {c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{c.phone}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--color-text-secondary)" }}>{c.email}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>{fmt(c.totalCredit)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{fmt(c.totalPaid)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, color: balance > 0 ? "#A32D2D" : "#3B6D11" }}>{fmt(balance)}</td>
                  <td style={{ padding: "10px 14px" }} onClick={e => { e.stopPropagation(); openEdit(c); }}>
                    <button style={{ fontSize: 12 }}>Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>No customers found</div>}
      </div>

      {showAdd && (
        <Modal title={editCustomer ? "Edit Customer" : "Add Customer"} onClose={() => setShowAdd(false)}>
          <Input label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Phone Number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Email Address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => setShowAdd(false)}>Cancel</button>
            <Btn variant="primary" onClick={handleSave}>{editCustomer ? "Save Changes" : "Add Customer"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Purchases() {
  const { products, suppliers, purchases, addPurchase, loading, error } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [orderNo, setOrderNo] = useState("");
  const [items, setItems] = useState([{ productId: "", qtyReceived: 1, purchasePrice: 0 }]);

  const addItem = () => setItems(i => [...i, { productId: "", qtyReceived: 1, purchasePrice: 0 }]);
  const removeItem = (idx) => setItems(i => i.filter((_, ii) => ii !== idx));
  const updateItem = (idx, field, val) => setItems(i => i.map((item, ii) => ii === idx ? { ...item, [field]: val } : item));

  const totalCost = items.reduce((s, i) => s + i.qtyReceived * i.purchasePrice, 0);

  const handleSave = async () => {
    if (!supplierId || items.some(i => !i.productId)) return;
    const selectedSupplier = suppliers.find(s => s.id === Number(supplierId));
    const poItems = items.map(i => {
      const p = products.find(x => x.id === Number(i.productId));
      return { productId: Number(i.productId), batchId: p?.batchId || String(i.productId), name: p?.name || "", qtyReceived: Number(i.qtyReceived), purchasePrice: Number(i.purchasePrice) };
    });
    await addPurchase({
      supplierId: Number(supplierId),
      supplierName: selectedSupplier?.shopName || selectedSupplier?.name || "",
      date: new Date(date).toISOString(),
      orderNo,
      items: poItems,
      total: totalCost,
      paid: 0,
      status: "REMAINING",
    });
    setShowForm(false);
    setSupplierId(""); setDate(new Date().toISOString().split("T")[0]); setOrderNo(""); setItems([{ productId: "", qtyReceived: 1, purchasePrice: 0 }]);
  };

  const totalSpent = purchases.reduce((s, p) => s + p.total, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Purchase Log</h2>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Track incoming stock from vendors</div>
        </div>
        <Btn variant="primary" onClick={() => setShowForm(true)}>+ New Purchase</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Orders" value={purchases.length} color="blue" />
        <StatCard label="Total Spent" value={fmt(totalSpent)} color="amber" />
        <StatCard label="Suppliers" value={suppliers.length} color="purple" />
      </div>

      <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              {["PO Number", "Supplier", "Date", "Items", "Total Cost"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#185FA5" }}>{p.id}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>{p.supplierName}</td>
                <td style={{ padding: "10px 14px", fontSize: 13 }}>{new Date(p.date).toLocaleDateString("en-IN")}</td>
                <td style={{ padding: "10px 14px", fontSize: 13 }}>
                  {(p.items || []).map(i => (
                    <div key={i.productId} style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                      {i.name} × {i.qtyReceived} @ {fmt(i.purchasePrice)}
                    </div>
                  ))}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>{fmt(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>No purchases recorded yet</div>}
      </div>

      {showForm && (
        <Modal title="New Purchase Order" onClose={() => setShowForm(false)} width={640}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Supplier *</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                <option value="">Select supplier…</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.shopName} ({s.name})</option>)}
              </select>
              {suppliers.length === 0 && <div style={{ fontSize: 11, color: "#A32D2D", marginTop: 4 }}>No suppliers yet — add one in the Suppliers tab first</div>}
            </div>
            <Input label="Purchase Order No." value={orderNo} onChange={e => setOrderNo(e.target.value)} placeholder="e.g. PO-2025-001" />
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div style={{ fontWeight: 500, fontSize: 13, margin: "16px 0 12px" }}>Items Received</div>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 10 }}>
              <div>
                {idx === 0 && <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Product</label>}
                <select value={item.productId} onChange={e => updateItem(idx, "productId", e.target.value)} style={{ width: "100%" }}>
                  <option value="">Select product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                {idx === 0 && <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Qty Received</label>}
                <input type="number" min="1" value={item.qtyReceived} onChange={e => updateItem(idx, "qtyReceived", Number(e.target.value))} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                {idx === 0 && <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Purchase Price</label>}
                <input type="number" min="0" value={item.purchasePrice} onChange={e => updateItem(idx, "purchasePrice", Number(e.target.value))} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
              <button onClick={() => removeItem(idx)} style={{ padding: "6px 10px", color: "#A32D2D" }}>✕</button>
            </div>
          ))}
          <button onClick={addItem} style={{ marginBottom: 16 }}>+ Add Item</button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ fontWeight: 500 }}>Total: {fmt(totalCost)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowForm(false)}>Cancel</button>
              <Btn variant="primary" onClick={handleSave}>Save Purchase & Update Stock</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "inventory", label: "Inventory", icon: "📦" },
  { id: "billing", label: "Billing / POS", icon: "🧾" },
  { id: "customers", label: "Customers", icon: "👥" },
  { id: "suppliers", label: "Suppliers", icon: "🏭" },
  { id: "purchases", label: "Purchases", icon: "🚛" },
];

function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, loading } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", shopName: "", phone: "", address: "", email: "" });

  const openAdd = () => { setForm({ name: "", shopName: "", phone: "", address: "", email: "" }); setEditItem(null); setShowAdd(true); };
  const openEdit = (s) => { setForm({ name: s.name, shopName: s.shopName, phone: s.phone, address: s.address || "", email: s.email || "" }); setEditItem(s); setShowAdd(true); };

  const handleSave = async () => {
    if (!form.name || !form.shopName || !form.phone) return;
    if (editItem) await updateSupplier(editItem.id, form);
    else await addSupplier(form);
    setShowAdd(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Suppliers</h2>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{suppliers.length} registered suppliers</div>
        </div>
        <Btn variant="primary" onClick={openAdd}>+ Add Supplier</Btn>
      </div>
      <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              {["Shop Name", "Contact Person", "Phone", "Email", "Address", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>{s.shopName}</td>
                <td style={{ padding: "10px 14px", fontSize: 13 }}>{s.name}</td>
                <td style={{ padding: "10px 14px", fontSize: 13 }}>{s.phone}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--color-text-secondary)" }}>{s.email}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--color-text-secondary)" }}>{s.address}</td>
                <td style={{ padding: "10px 14px" }}>
                  <button onClick={() => openEdit(s)} style={{ fontSize: 12 }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {suppliers.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>No suppliers yet</div>}
      </div>
      {showAdd && (
        <Modal title={editItem ? "Edit Supplier" : "Add Supplier"} onClose={() => setShowAdd(false)}>
          <Input label="Contact Person Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Shop / Company Name *" value={form.shopName} onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))} />
          <Input label="Phone *" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => setShowAdd(false)}>Cancel</button>
            <Btn variant="primary" onClick={handleSave}>{editItem ? "Save Changes" : "Add Supplier"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function GlobalStatus() {
  const { loading, error } = useApp();
  if (loading) return <div style={{ position: "fixed", top: 12, right: 16, background: "#E6F1FB", color: "#185FA5", padding: "6px 14px", borderRadius: 20, fontSize: 12, zIndex: 9999 }}>⏳ Syncing…</div>;
  if (error) return <div style={{ position: "fixed", top: 12, right: 16, background: "#FCEBEB", color: "#A32D2D", padding: "6px 14px", borderRadius: 20, fontSize: 12, zIndex: 9999 }}>⚠ {error}</div>;
  return null;
}

export default function App() {
  const [tab, setTab] = useState("dashboard");

  return (
    <AppProvider>
      <GlobalStatus />
      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: "var(--color-background-tertiary)" }}>
        <div style={{ width: 220, flexShrink: 0, background: "var(--color-background-primary)", borderRight: "0.5px solid var(--color-border-tertiary)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 20px 20px" }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#185FA5" }}>RetailPro</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>Shop Management</div>
          </div>
          <nav style={{ flex: 1, padding: "0 12px" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, marginBottom: 4, fontSize: 13, fontWeight: tab === t.id ? 500 : 400,
                  background: tab === t.id ? "#E6F1FB" : "transparent", color: tab === t.id ? "#185FA5" : "var(--color-text-secondary)", border: "none", cursor: "pointer", textAlign: "left"
                }}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: "16px 20px", fontSize: 11, color: "var(--color-text-secondary)", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
            No GST · Pure pricing only
          </div>
        </div>
        <main style={{ flex: 1, padding: 32, minWidth: 0, overflowY: "auto" }}>
          {tab === "dashboard" && <Dashboard navigate={setTab} />}
          {tab === "inventory" && <Inventory />}
          {tab === "billing" && <Billing />}
          {tab === "customers" && <Customers />}
          {tab === "suppliers" && <Suppliers />}
          {tab === "purchases" && <Purchases />}
        </main>
      </div>
    </AppProvider>
  );
}
