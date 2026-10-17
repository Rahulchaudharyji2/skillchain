import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";

export const metadata: Metadata = {
  title: "SkillChain — Verifiable Skills, Trusted Hiring",
  description:
    "A full-stack, blockchain-enabled student credential, skill assessment, and AI-powered recruitment platform. Built on Polygon Amoy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-cream-50 text-forest-950 font-sans selection:bg-ochre-200 selection:text-forest-950 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
