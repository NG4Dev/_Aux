import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConvexProviderWithClerk from "@/components/ConvexProviderWithClerk";
import AnalyticsScripts from "@/components/analytics/AnalyticsScripts";
import WebAnalyticsObserver from "@/components/analytics/WebAnalyticsObserver";
import { Toaster } from "@/components/ui/sonner";
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
  title: "ycago",
  description: "Discover places, products, and events in your city.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <AnalyticsScripts />
          <ConvexProviderWithClerk>
            <Suspense fallback={null}>
              <WebAnalyticsObserver />
            </Suspense>
            {children}
          </ConvexProviderWithClerk>
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
