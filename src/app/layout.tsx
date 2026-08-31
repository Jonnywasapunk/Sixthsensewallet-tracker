import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Sixth Sense Pay — Wallet Tracker",
  description: "Stablecoin balances & movements across Polygon and Tron.",
  icons: {
    icon: "/brand/isotipo.png",
    apple: "/brand/isotipo.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
