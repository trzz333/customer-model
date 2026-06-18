import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Customer Model — stress-test a business model",
  description:
    "A deterministic, game-theory and behavioral-economics simulation that stress-tests a business model against synthetic customer archetypes. Reproducible, auditable, not a black box.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
