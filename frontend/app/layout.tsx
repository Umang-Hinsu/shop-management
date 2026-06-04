import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sweta Electric — Shop Management",
  description: "Retail shop management system for Sweta Electric",
  icons: {
    icon: "https://ik.imagekit.io/aiuser/Sweta%20Electric/icon.png?updatedAt=1771245965149",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
