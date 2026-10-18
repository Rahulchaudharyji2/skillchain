import Link from "next/link";
import { ShieldCheck, Search, QrCode, FileCheck, ArrowUpRight, LogIn } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { DemoSwitcher } from "./DemoSwitcher";
import { MobileNavbar } from "./MobileNavbar";
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
    <header className="sticky top-0 z-30 w-full border-b border-cream-300/80 bg-cream-50/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-5 xl:gap-8 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-forest-900 text-ochre-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-ochre-300" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-base text-forest-950 tracking-tight leading-none">
                  SkillChain
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-ochre-100 text-ochre-900 border border-ochre-300 whitespace-nowrap leading-none shadow-2xs">
                  Amoy Testnet
                </span>
              </div>
              <span className="text-[10px] text-stone-500 font-medium tracking-tight whitespace-nowrap leading-none mt-1">
                Verifiable Skills, Trusted Hiring
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-stone-600">
          <Link
            href="/jobs"
            className="px-2.5 py-1.5 rounded-lg hover:text-forest-950 hover:bg-cream-200/60 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <span>Job Board</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </Link>

          <Link
            href="/wallet"
            className="px-2.5 py-1.5 rounded-lg hover:text-forest-950 hover:bg-cream-200/60 transition-colors whitespace-nowrap text-ochre-800 font-bold"
          >
            Token Wallet
          </Link>

          <Link
            href="/verify/0x8fae19b489a24dcbe89123849182a47291847192849182938491829384918293"
            className="px-2.5 py-1.5 rounded-lg hover:text-forest-950 hover:bg-cream-200/60 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5 text-stone-500" />
            <span>Verify Credential</span>
          </Link>

          <Link
            href="/features"
            className="px-2.5 py-1.5 rounded-lg hover:text-forest-950 hover:bg-cream-200/60 transition-colors whitespace-nowrap"
          >
            Features
          </Link>

          <Link
            href="/how-it-works"
            className="hidden 2xl:inline-flex px-2.5 py-1.5 rounded-lg hover:text-forest-950 hover:bg-cream-200/60 transition-colors whitespace-nowrap"
          >
            How It Works
          </Link>

          <Link
            href="/universities"
            className="hidden 2xl:inline-flex px-2.5 py-1.5 rounded-lg hover:text-forest-950 hover:bg-cream-200/60 transition-colors whitespace-nowrap"
          >
            Universities
          </Link>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          <div className="hidden sm:block">
            <MetaMaskWalletButton />
          </div>

          {!user && (
            <Link
              href="/login"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:text-forest-900 hover:bg-stone-100 transition-all whitespace-nowrap"
              title="Institutional Login"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>
          )}

          <div className="hidden sm:block">
            <DemoSwitcher
              currentRole={user?.role || "STUDENT"}
              userName={user?.name || "Alex Rivera"}
              userEmail={user?.email || "alex.rivera@student.mit.edu"}
            />
          </div>

          <Link
            href={getPortalLink()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 transition-all text-xs font-semibold shadow-xs whitespace-nowrap flex-shrink-0"
          >
            <span>Launch Portal</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ochre-300" />
          </Link>

          {/* Mobile Navigation Drawer Trigger */}
          <MobileNavbar
            userRole={user?.role || "STUDENT"}
            userName={user?.name || "Alex Rivera"}
            userEmail={user?.email || "alex.rivera@student.mit.edu"}
            portalLink={getPortalLink()}
          />
        </div>
      </div>
    </header>
  );
}
