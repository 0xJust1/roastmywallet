import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://roastmywallet.lol"),
  title: "RoastMyWallet - Brutal EVM Memecoin & Portfolio Roaster",
  description: "Get a savage, hilarious AI-generated roast of your EVM wallet address. Analyze your shitcoins, rugs, and terrible trades on Base and Ethereum.",
  openGraph: {
    title: "RoastMyWallet - Brutal EVM Memecoin & Portfolio Roaster",
    description: "Get a savage, hilarious AI-generated roast of your EVM wallet address. Analyze your shitcoins, rugs, and terrible trades on Base and Ethereum.",
    url: "https://roastmywallet.lol",
    siteName: "RoastMyWallet",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "RoastMyWallet - Brutal EVM Memecoin & Portfolio Roaster",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RoastMyWallet - Brutal EVM Memecoin & Portfolio Roaster",
    description: "Get a savage, hilarious AI-generated roast of your EVM wallet address. Analyze your shitcoins, rugs, and terrible trades on Base and Ethereum.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
