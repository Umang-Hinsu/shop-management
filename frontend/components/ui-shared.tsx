"use client";

import { ReactNode, MouseEvent } from "react";

export function Badge({ children, color = "gray" }: { children: ReactNode; color?: "green" | "red" | "amber" | "blue" | "gray" }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    gray: "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Modal({ title, onClose, children, width = "max-w-lg" }: { title: string; onClose: () => void; children: ReactNode; width?: string }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl w-full ${width} max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub, color = "blue" }: { label: string; value: string | number; sub?: string; color?: "blue" | "green" | "amber" | "red" | "gray" }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100",
    green: "bg-emerald-50 border-emerald-100",
    amber: "bg-amber-50 border-amber-100",
    red: "bg-red-50 border-red-100",
    gray: "bg-gray-50 border-gray-100",
  };
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-semibold text-gray-800">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

type BtnVariant = "default" | "primary" | "danger" | "success" | "secondary";

export function Btn({
  children,
  onClick,
  variant = "default",
  disabled,
  type = "button",
  className = "",
  tabIndex,
}: {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: BtnVariant;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  tabIndex?: number;
}) {
  const base = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<BtnVariant, string> = {
    default: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300",
    primary: "bg-blue-600 border border-blue-700 text-white hover:bg-blue-700 focus:ring-blue-400",
    danger: "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 focus:ring-red-300",
    success: "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-300",
    secondary: "bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 focus:ring-gray-300",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} tabIndex={tabIndex} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function FormField({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors";
export const selectCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors";
