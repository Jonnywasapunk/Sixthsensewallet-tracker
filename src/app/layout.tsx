import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sixth Sense Pay — Wallet Tracker",
  description: "Stablecoin balances & movements across Polygon and Tron.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
