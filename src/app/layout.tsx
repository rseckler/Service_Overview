import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Service Overview",
  description: "Status-Dashboard für alle Services",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
