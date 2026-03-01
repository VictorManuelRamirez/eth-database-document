import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MetaMaskProvider } from "@/contexts/MetaMaskContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocChain — Secure Document Verification",
  description:
    "Store, sign, and verify document hashes on the blockchain with complete transparency and security. Powered by Ethereum & Solidity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0b1120]`}
      >
        <MetaMaskProvider>
          {children}
        </MetaMaskProvider>
      </body>
    </html>
  );
}
