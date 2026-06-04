"use client";

import { useState } from "react";
import { AppProvider } from "@/lib/store";
import Dashboard from "@/components/Dashboard";
import Inventory from "@/components/Inventory";
import Billing from "@/components/Billing";
import Customers from "@/components/Customers";
import Purchases from "@/components/Purchases";
import History from "@/components/History";
import { LayoutDashboard, Package, Receipt, Users, ShoppingCart, History as HistoryIcon, Menu, X } from "lucide-react";

type Tab = "dashboard" | "inventory" | "billing" | "history" | "customers" | "purchases";

const TABS: { id: Tab; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard as any },
  { id: "inventory", label: "Inventory", Icon: Package as any },
  { id: "billing", label: "Billing / POS", Icon: Receipt as any },
  { id: "history", label: "History", Icon: HistoryIcon as any },
  { id: "customers", label: "Customers", Icon: Users as any },
  { id: "purchases", label: "Purchases", Icon: ShoppingCart as any },
];

export default function AppShell() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <AppProvider>
      <div className="flex min-h-screen bg-gray-50 font-sans">
        
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <Menu className="w-6 h-6" />
            </button>
            <img
              src="https://ik.imagekit.io/aiuser/Sweta%20Electric/logo.png?updatedAt=1771245308484"
              alt="Sweta Electric Logo"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {TABS.find(t => t.id === tab)?.label}
          </div>
        </header>

        {/* Mobile Drawer Overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity print:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar (Desktop and Mobile Drawer) */}
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-56 lg:z-auto print:hidden ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-5 py-6 border-b border-gray-100 flex items-center justify-between">
            <img
              src="https://ik.imagekit.io/aiuser/Sweta%20Electric/logo.png?updatedAt=1771245308484"
              alt="Sweta Electric Logo"
              className="h-10 w-auto object-contain"
            />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setTab(id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  tab === id
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${tab === id ? "text-blue-600" : "text-gray-400"}`} />
                {label}
              </button>
            ))}
          </nav>

          <div className="px-5 py-4 border-t border-gray-100 text-xs text-gray-300">
            No GST · Pure pricing
          </div>
        </aside>

        {/* Main content wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-20 lg:pt-8">
            {tab === "dashboard" && <Dashboard navigate={(t: string) => setTab(t as Tab)} />}
            {tab === "inventory" && <Inventory />}
            {tab === "billing" && <Billing />}
            {tab === "history" && <History />}
            {tab === "customers" && <Customers />}
            {tab === "purchases" && <Purchases />}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
