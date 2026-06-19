import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], display: "swap" });

const TITLE = "Customer Model — stress-test a business model";
const DESCRIPTION =
  "A deterministic, game-theory and behavioral-economics simulation that stress-tests a business model against synthetic customer archetypes. Reproducible, auditable, not a black box.";

export const metadata: Metadata = {
  metadataBase: new URL("https://customer-model.council.fyi"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: "https://customer-model.council.fyi",
    siteName: "Customer Model",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
