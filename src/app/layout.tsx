import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import Link from "next/link";

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
      <body className={`${spaceGrotesk.variable} ${sourceSans.variable} antialiased`}>
        <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3 md:px-8">
            <Link
              href="/"
              className="mr-4 font-bold tracking-tight text-zinc-900 transition-colors hover:text-lime-800"
            >
              handicapped
            </Link>
            <Link
              href="/player/randall"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              Randall
            </Link>
            <Link
              href="/player/jaden"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              Jaden
            </Link>
            <Link
              href="/courses"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              Courses
            </Link>
          </div>
        </nav>

        <div className="min-h-[calc(100vh-10rem)]">{children}</div>

        <footer className="mt-12 border-t border-zinc-100 py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-8 px-4 text-xs text-zinc-400 md:px-8">
            <Link href="/export" className="transition-colors hover:text-zinc-600">
              Export data
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
