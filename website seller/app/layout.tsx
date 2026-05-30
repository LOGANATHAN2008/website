import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MaintenanceGuard from "@/components/MaintenanceGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loganathan M | Premium Website Development & Website Seller",
  description: "Get premium, high-performance, custom websites with stunning macOS glassmorphism style UI. Professional website seller & freelance web developer Loganathan M.",
  keywords: ["Loganathan M", "web developer", "website seller", "buy website", "premium website development", "custom web design", "portfolio website developer", "e-commerce developer", "freelance developer", "glassmorphism UI", "React developer", "Next.js web developer"],
  authors: [{ name: "Loganathan M" }],
  metadataBase: new URL("https://web.loganathan.site"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://web.loganathan.site",
    title: "Loganathan M | Premium Website Development & Website Seller",
    description: "Get premium, high-performance, custom websites with stunning macOS glassmorphism style UI. Professional website seller & freelance web developer Loganathan M.",
    images: [{ url: "/logo.png" }],
    siteName: "Loganathan M Services",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loganathan M | Premium Website Development & Website Seller",
    description: "Get premium, high-performance, custom websites with stunning macOS glassmorphism style UI. Professional website seller & freelance web developer Loganathan M.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <MaintenanceGuard>
          {children}
        </MaintenanceGuard>
      </body>
    </html>
  );
}
