import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "handicapped",
  description: "Golf rounds, stats, and Handicap Index tracking for Randall and Jaden.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${sourceSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
