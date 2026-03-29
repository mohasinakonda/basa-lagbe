import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainHeader } from "@/components/header/main-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ListingsProvider } from "@/lib/listings-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Basa Lagbe – Home Rent",
  description: "Find and list homes for rent. Filter by location and category (Family/Bachelor/Both).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <ListingsProvider>
          <MainHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </ListingsProvider>
      </body>
    </html>
  );
}
