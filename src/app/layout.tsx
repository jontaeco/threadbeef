import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne, Space_Mono } from "next/font/google";
import "./globals.css";
import { SoundProvider } from "@/contexts/SoundContext";
import { MobileNav } from "@/components/layout/MobileNav";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ThreadBeef 🥩 — Random Internet Arguments",
  description:
    "Read random internet arguments, vote on who won, and share the best beefs. TikTok for text-based internet drama.",
  manifest: "/manifest.json",
  openGraph: {
    title: "ThreadBeef 🥩",
    description: "Random Internet Arguments — Read, Vote, Share",
    type: "website",
    siteName: "ThreadBeef",
  },
  twitter: {
    card: "summary_large_image",
    title: "ThreadBeef 🥩",
    description: "Random Internet Arguments — Read, Vote, Share",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable} ${spaceMono.variable}`}
    >
      <body className="font-body">
        <SoundProvider>
          {children}
          <MobileNav />
        </SoundProvider>
      </body>
    </html>
  );
}
