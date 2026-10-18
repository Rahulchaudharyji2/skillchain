"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ShieldCheck,
  FileCheck,
  Award,
  Sparkles,
  Briefcase,
  ExternalLink,
  LogIn,
  School,
  QrCode,
  ArrowRight,
} from "lucide-react";
import { MetaMaskWalletButton } from "@/components/blockchain/MetaMaskWalletButton";
import { DemoSwitcher } from "./DemoSwitcher";

interface MobileNavbarProps {
  userRole: string;
  userName: string;
  userEmail: string;
  portalLink: string;
}

export function MobileNavbar({
  userRole,
  userName,
  userEmail,
  portalLink,
}: MobileNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleMenu}
        aria-label="Toggle Navigation Menu"
        className="md:hidden p-2 rounded-xl text-forest-900 hover:bg-cream-200/80 transition-colors focus:outline-none"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Dropdown Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-cream-50/98 backdrop-blur-xl border-b border-cream-300 shadow-2xl p-5 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col space-y-4">
            {/* Quick Demo Switcher & Wallet */}
            <div className="pb-4 border-b border-cream-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Active Persona & Wallet
                </span>
                <MetaMaskWalletButton />
              </div>
              <DemoSwitcher
                currentRole={userRole}
                userName={userName}
                userEmail={userEmail}
              />
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-stone-700">
              <Link
                href="/student/passport"
                onClick={closeMenu}
                className="flex items-center justify-between p-2.5 rounded-xl bg-forest-900 text-cream-50"
              >
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-4 h-4 text-ochre-300" />
                  <span>Student Skill Passport</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
              </Link>

              <Link
                href="/jobs"
                onClick={closeMenu}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cream-200/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-forest-700" />
                  <span>Explore Jobs & Matching</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </Link>

              <Link
                href="/wallet"
                onClick={closeMenu}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cream-200/60 text-ochre-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-ochre-600" />
                  <span>SkillChain Token Wallet</span>
                </div>
              </Link>

              <Link
                href="/verify/0x8fae19b489a24dcbe89123849182a47291847192849182938491829384918293"
                onClick={closeMenu}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cream-200/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <span>Verify Credential On-Chain</span>
                </div>
              </Link>

              <Link
                href="/universities"
                onClick={closeMenu}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cream-200/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <School className="w-4 h-4 text-forest-700" />
                  <span>Universities & Registrar</span>
                </div>
              </Link>
            </nav>

            {/* Launch Active Portal Action */}
            <div className="pt-3 border-t border-cream-200 flex items-center justify-between gap-3">
              <Link
                href="/login"
                onClick={closeMenu}
                className="px-4 py-2.5 rounded-xl border border-cream-300 text-xs font-semibold text-stone-700 hover:bg-cream-100 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>

              <Link
                href={portalLink}
                onClick={closeMenu}
                className="flex-1 px-4 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Launch My Portal</span>
                <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
