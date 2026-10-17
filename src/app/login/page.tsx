"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  School,
  Briefcase,
  GraduationCap,
  KeyRound,
  Loader2,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { POLYGON_AMOY_CHAIN_ID } from "@/lib/blockchain/client";

type LoginRole = "UNIVERSITY_ADMIN" | "RECRUITER" | "STUDENT" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<LoginRole>("UNIVERSITY_ADMIN");
  const [email, setEmail] = useState("issuer@mit.edu");
  const [password, setPassword] = useState("UniversityAdmin2024!");
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectTab = (role: LoginRole) => {
    setActiveTab(role);
    setError(null);
    if (role === "UNIVERSITY_ADMIN") {
      setEmail("issuer@mit.edu");
      setPassword("UniversityAdmin2024!");
    } else if (role === "RECRUITER") {
      setEmail("recruiter@stripe.com");
      setPassword("Recruiter2024!");
    } else if (role === "STUDENT") {
      setEmail("alex.rivera@student.mit.edu");
      setPassword("Student2024!");
    } else if (role === "ADMIN") {
      setEmail("admin@skillchain.org");
      setPassword("Admin2024!");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: activeTab }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(data.redirectPath || "/");
        router.refresh();
      } else {
        setError(data.error || "Login failed. Please check credentials.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reach authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const handleMetaMaskLogin = async () => {
    setError(null);
    setWalletLoading(true);

    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        alert("MetaMask extension not detected. Please install MetaMask to use Web3 login.");
        setWalletLoading(false);
        return;
      }

      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];

      // Switch to Polygon Amoy
      const amoyHex = "0x" + POLYGON_AMOY_CHAIN_ID.toString(16);
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: amoyHex }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: amoyHex,
                chainName: "Polygon Amoy Testnet",
                nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                rpcUrls: ["https://rpc-amoy.polygon.technology"],
                blockExplorerUrls: ["https://amoy.polygonscan.com"],
              },
            ],
          });
        }
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          role: activeTab === "RECRUITER" ? "RECRUITER" : "STUDENT",
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(data.redirectPath || "/student/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Wallet authentication failed.");
      }
    } catch (err: any) {
      setError(err?.message || "MetaMask connection was cancelled.");
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 card-premium p-8 bg-white border border-stone-200 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-forest-900 text-ochre-400 flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-7 h-7 text-ochre-300" />
          </div>
          <h2 className="mt-4 text-2xl font-display font-bold text-forest-950">
            Sign In to SkillChain
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Verifiable credentials, soulbound academic degrees, and trusted hiring.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-stone-100 text-xs font-semibold">
          <button
            onClick={() => selectTab("UNIVERSITY_ADMIN")}
            className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeTab === "UNIVERSITY_ADMIN"
                ? "bg-white text-forest-950 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <School className="w-4 h-4 text-emerald-700" />
            <span className="text-[10px]">College</span>
          </button>

          <button
            onClick={() => selectTab("STUDENT")}
            className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeTab === "STUDENT"
                ? "bg-white text-forest-950 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-700" />
            <span className="text-[10px]">Student</span>
          </button>

          <button
            onClick={() => selectTab("RECRUITER")}
            className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeTab === "RECRUITER"
                ? "bg-white text-forest-950 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Briefcase className="w-4 h-4 text-blue-700" />
            <span className="text-[10px]">Recruiter</span>
          </button>

          <button
            onClick={() => selectTab("ADMIN")}
            className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeTab === "ADMIN"
                ? "bg-white text-forest-950 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <KeyRound className="w-4 h-4 text-purple-700" />
            <span className="text-[10px]">Admin</span>
          </button>
        </div>

        {/* Role Description Card */}
        <div className="p-3 rounded-xl bg-cream-50 border border-cream-200 text-[11px] text-stone-600 space-y-1">
          {activeTab === "UNIVERSITY_ADMIN" && (
            <p>
              🏛️ <strong>University Registrar Portal:</strong> Sign in to issue digitally signed soulbound degrees to students on Polygon Amoy.
            </p>
          )}
          {activeTab === "STUDENT" && (
            <p>
              🎓 <strong>Student Portal:</strong> Connect your MetaMask to accept soulbound degrees, take sandboxed skill assessments, and share QR passport.
            </p>
          )}
          {activeTab === "RECRUITER" && (
            <p>
              💼 <strong>Employer Portal:</strong> Create AI-generated jobs, discover candidates with 5-tier evidence matching, and review interview reports.
            </p>
          )}
          {activeTab === "ADMIN" && (
            <p>
              ⚡ <strong>Governance Console:</strong> Manage institutional issuer KYC whitelisting, review proctoring flags, and inspect audit logs.
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Web3 MetaMask Primary Option for Student */}
        {activeTab === "STUDENT" && (
          <div className="space-y-3 pb-2">
            <button
              onClick={handleMetaMaskLogin}
              disabled={walletLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {walletLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Connecting MetaMask...</span>
                </>
              ) : (
                <>
                  <span className="text-base">🦊</span>
                  <span>Sign In with MetaMask (Web3 Student)</span>
                </>
              )}
            </button>

            <div className="relative flex items-center justify-center">
              <span className="absolute inset-x-0 h-px bg-stone-200"></span>
              <span className="relative bg-white px-2 text-[10px] text-stone-400 uppercase font-bold">
                Or With Email & Password
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              <span>Institutional Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to {activeTab.replace("_", " ")}</span>
                <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Cheat Sheet */}
        <div className="pt-2 border-t border-stone-100 text-[10px] text-stone-400 space-y-1">
          <div className="flex items-center justify-between font-mono">
            <span>University: issuer@mit.edu</span>
            <span>Password: UniversityAdmin2024!</span>
          </div>
          <div className="flex items-center justify-between font-mono">
            <span>Recruiter: recruiter@stripe.com</span>
            <span>Password: Recruiter2024!</span>
          </div>
          <div className="flex items-center justify-between font-mono">
            <span>Student: alex.rivera@student.mit.edu</span>
            <span>Password: Student2024!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
