import Link from "next/link";
import { ShieldCheck, Search, QrCode, FileCheck, ArrowUpRight, LogIn } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { DemoSwitcher } from "./DemoSwitcher";
import { MetaMaskWalletButton } from "@/components/blockchain/MetaMaskWalletButton";

export async function Navbar() {
  const user = await getCurrentUser();

  const getPortalLink = () => {
    if (!user) return "/student/dashboard";
    switch (user.role) {
      case "ISSUER":
      case "UNIVERSITY_ADMIN":
        return "/university/dashboard";
      case "RECRUITER":
        return "/recruiter/dashboard";
      case "ADMIN":
        return "/admin/dashboard";
      case "STUDENT":
      default:
        return "/student/dashboard";
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-cream-300/80 bg-cream-50/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-forest-900 text-ochre-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-ochre-300" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-forest-950 tracking-tight flex items-center gap-1.5">
                SkillChain
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ochre-100 text-ochre-900 border border-ochre-300">
                  Amoy Testnet
                </span>
              </span>
              <p className="text-[10px] text-stone-500 font-medium tracking-tight">
                Verifiable Skills, Trusted Hiring
              </p>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600">
            <Link href="/features" className="hover:text-forest-900 transition-colors">
              Features
            </Link>
            <Link href="/how-it-works" className="hover:text-forest-900 transition-colors">
              How It Works
            </Link>
            <Link href="/universities" className="hover:text-forest-900 transition-colors">
              Universities
            </Link>
            <Link href="/employers" className="hover:text-forest-900 transition-colors">
              Employers
            </Link>
            <Link href="/jobs" className="hover:text-forest-900 transition-colors flex items-center gap-1">
              Job Board
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </Link>
            <Link
              href="/verify/0x8fae19b489a24dcbe89123849182a47291847192849182938491829384918293"
              className="hover:text-forest-900 transition-colors flex items-center gap-1 text-ochre-800"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Verify Credential
            </Link>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <MetaMaskWalletButton />

          <Link
            href="/login"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:text-forest-900 hover:bg-stone-100 transition-all"
            title="Institutional Login"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </Link>

          <DemoSwitcher
            currentRole={user?.role || "STUDENT"}
            userName={user?.name || "Alex Rivera"}
            userEmail={user?.email || "alex.rivera@student.mit.edu"}
          />

          <Link
            href={getPortalLink()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 transition-all text-xs font-semibold shadow-sm"
          >
            <span>Launch Portal</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ochre-300" />
          </Link>
        </div>
      </div>
    </header>
  );
}
