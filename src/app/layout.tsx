import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "Photo Showcase — A Curated Collection of Moments",
    template: "%s | Photo Showcase",
  },
  description:
    "A beautiful photo gallery showcasing curated albums from Google Photos. Browse stunning collections of photography.",
  keywords: ["photography", "gallery", "photos", "albums", "showcase"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Photo Showcase",
    title: "Photo Showcase — A Curated Collection of Moments",
    description:
      "A beautiful photo gallery showcasing curated albums from Google Photos.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Photo Showcase",
    description:
      "A beautiful photo gallery showcasing curated albums from Google Photos.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
