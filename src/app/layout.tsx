import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Haven Estate | AI-Powered Real Estate Marketplace",
  description:
    "Discover exceptional properties with intelligent listing assistance. Haven Estate combines premium real estate with AI technology to help agents create compelling listings.",
  keywords: [
    "real estate",
    "property marketplace",
    "AI listings",
    "home buying",
    "property listings",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${dmSans.variable} antialiased`}>
        {children}
        <Footer />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-stone-800">
              <span className="font-display text-lg font-semibold text-white">
                H
              </span>
            </div>
            <span className="font-display text-xl font-semibold text-stone-800">
              Haven Estate
            </span>
          </div>

          {/* Built with */}
          <div className="flex flex-col items-center gap-1 text-center text-sm text-stone-500">
            <p>Built with Next.js, Tailwind CSS, Prisma, and OpenAI API</p>
            <p className="text-stone-400">
              Crafted by{" "}
              <span className="font-medium text-stone-600">
                Oluwatobiloba Odebo
              </span>
            </p>
          </div>

          {/* Copyright */}
          <div className="text-sm text-stone-400">
            {new Date().getFullYear()} Haven Estate
          </div>
        </div>
      </div>
    </footer>
  );
}
