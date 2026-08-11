import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { TopLoadingBar } from "@/components/top-loading-bar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Multi-Rate Pricing Calculator",
  description: "Document pricing calculator and summary reporting tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <Suspense fallback={null}>
          <TopLoadingBar />
        </Suspense>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
