"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Sparkles,
  ArrowRight,
  School,
  Briefcase,
  User,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  CreditCard,
  Layers,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";

interface UnlockItem {
  id: string;
  orgName: string;
  studentName: string;
  platformTokens: number;
  studentTokens: number;
  unlockedAt: string;
}

interface WalletHubClientProps {
  currentUserRole: string;
  currentUserName: string;
  currentUserEmail: string;
  studentBalance: number;
  employerBalance: number;
  universityBalance: number;
  studentName: string;
  employerName: string;
  universityName: string;
  unlocks: UnlockItem[];
}

export function WalletHubClient({
  currentUserRole,
  currentUserName,
  currentUserEmail,
  studentBalance: initialStudentBal,
  employerBalance: initialEmployerBal,
  universityBalance: initialUniBal,
  studentName,
  employerName,
  universityName,
  unlocks,
}: WalletHubClientProps) {
  const [studentBal, setStudentBal] = useState(initialStudentBal);
  const [employerBal, setEmployerBal] = useState(initialEmployerBal);
  const [uniBal, setUniBal] = useState(initialUniBal);

  const [buyingTokens, setBuyingTokens] = useState<number | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<number>(10);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleBuyTokens = async (targetRole: "RECRUITER" | "ISSUER" | "STUDENT", qty: number) => {
    setBuyingTokens(qty);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/wallet/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: qty, role: targetRole }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (targetRole === "RECRUITER") {
          setEmployerBal(data.tokenBalance);
        } else if (targetRole === "ISSUER") {
          setUniBal(data.tokenBalance);
        } else if (targetRole === "STUDENT") {
          setStudentBal(data.tokenBalance);
        }
        setSuccessMsg(data.message || `Purchased ${qty} tokens successfully!`);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      } else {
        alert(data.error || "Failed to purchase tokens");
      }
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to communicate with wallet API"));
    } finally {
      setBuyingTokens(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Wallet className="w-3.5 h-3.5" />
          <span>SkillChain Unified Token Economy</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Platform Wallets & Token Allocation
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Complete transparent token ledger: HR unlocks profiles (5 tokens total: 3 to platform treasury + 2 directly to student wallet),
          and Universities utilize 3 tokens to anchor verifiable soulbound degrees on Polygon Amoy.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
            SETTLED ON-CHAIN
          </span>
        </div>
      )}

      {/* 3 Role Wallets Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 1. Student Wallet */}
        <div className="card-premium p-6 bg-white border border-cream-300 flex flex-col justify-between space-y-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                Candidate Wallet
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </div>

            <h3 className="text-base font-bold text-forest-950 mt-3">{studentName}</h3>
            <span className="text-[11px] text-stone-500">Student Talent Passport</span>

            <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block">
                Earned Token Balance
              </span>
              <div className="text-3xl font-extrabold font-mono text-amber-950 mt-1 flex items-baseline gap-2">
                <span>{studentBal}</span>
                <span className="text-xs font-sans font-semibold text-amber-700">Tokens</span>
              </div>
              <p className="text-[10px] text-stone-600 mt-2 leading-tight flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>Receives <strong>+2 Tokens</strong> directly whenever an HR unlocks their profile!</span>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-cream-100 flex items-center justify-between text-xs">
            <Link
              href="/student/dashboard"
              className="text-forest-800 hover:text-forest-950 font-bold flex items-center gap-1"
            >
              <span>Student Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. HR / Recruiter Wallet */}
        <div className="card-premium p-6 bg-white border border-cream-300 flex flex-col justify-between space-y-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                Employer / HR Wallet
              </span>
              <div className="w-8 h-8 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>

            <h3 className="text-base font-bold text-forest-950 mt-3">{employerName} Hiring</h3>
            <span className="text-[11px] text-stone-500">Verified Recruiter Account</span>

            <div className="mt-4 p-4 rounded-xl bg-forest-900 text-cream-50">
              <span className="text-[10px] font-bold uppercase text-ochre-300 tracking-wider block">
                Available Token Balance
              </span>
              <div className="text-3xl font-extrabold font-mono text-white mt-1 flex items-baseline gap-2">
                <span>{employerBal}</span>
                <span className="text-xs font-sans font-semibold text-cream-300">Tokens</span>
              </div>
              <p className="text-[10px] text-cream-200 mt-2 leading-tight flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-ochre-300" />
                <span>Spends <strong>5 Tokens</strong> per profile (3 to platform + 2 to student).</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-cream-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBuyTokens("RECRUITER", 10)}
                disabled={buyingTokens !== null}
                className="flex-1 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 disabled:opacity-50 text-cream-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                {buyingTokens === 10 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-ochre-300" />}
                <span>Buy 10 Tokens ($10)</span>
              </button>

              <button
                onClick={() => handleBuyTokens("RECRUITER", 25)}
                disabled={buyingTokens !== null}
                className="py-2 px-3 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 font-bold text-xs"
              >
                +25
              </button>
            </div>

            <Link
              href="/recruiter/applications"
              className="text-xs text-forest-800 hover:text-forest-950 font-bold flex items-center justify-center gap-1 pt-1"
            >
              <span>Go to Job Applicants</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3. University Institutional Wallet */}
        <div className="card-premium p-6 bg-white border border-cream-300 flex flex-col justify-between space-y-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                University Institutional Wallet
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <School className="w-4 h-4" />
              </div>
            </div>

            <h3 className="text-base font-bold text-forest-950 mt-3">{universityName} Registry</h3>
            <span className="text-[11px] text-stone-500">Degree Issuance Authority</span>

            <div className="mt-4 p-4 rounded-xl bg-purple-50/70 border border-purple-200">
              <span className="text-[10px] font-bold uppercase text-purple-800 tracking-wider block">
                Institutional Token Balance
              </span>
              <div className="text-3xl font-extrabold font-mono text-purple-950 mt-1 flex items-baseline gap-2">
                <span>{uniBal}</span>
                <span className="text-xs font-sans font-semibold text-purple-700">Tokens</span>
              </div>
              <p className="text-[10px] text-stone-600 mt-2 leading-tight flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-600" />
                <span>Allocates <strong>3 Tokens</strong> per degree to anchor onto Polygon Amoy.</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-cream-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBuyTokens("ISSUER", 15)}
                disabled={buyingTokens !== null}
                className="flex-1 py-2 rounded-lg bg-purple-900 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                {buyingTokens === 15 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-200" />}
                <span>Buy 15 Tokens ($15)</span>
              </button>

              <button
                onClick={() => handleBuyTokens("ISSUER", 30)}
                disabled={buyingTokens !== null}
                className="py-2 px-3 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 font-bold text-xs"
              >
                +30
              </button>
            </div>

            <Link
              href="/university/credentials/issue"
              className="text-xs text-purple-900 hover:text-purple-950 font-bold flex items-center justify-center gap-1 pt-1"
            >
              <span>Issue Degree (Uses 3 Tokens)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Token Distribution Rules Breakdown */}
      <div className="card-premium p-6 bg-white border border-cream-300 space-y-4">
        <h3 className="text-sm font-bold text-forest-950 flex items-center gap-2">
          <Layers className="w-4 h-4 text-forest-800" />
          <span>SkillChain Economic Rules Engine</span>
        </h3>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-forest-950">1. Candidate Profile Unlock Split:</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold font-mono text-[10px]">
                5 TOKENS
              </span>
            </div>
            <p className="text-stone-600 leading-relaxed">
              When an HR unlocks an applicant to view their full contact details and schedule a 1:1 interview:
            </p>
            <ul className="space-y-1 list-disc list-inside text-stone-700">
              <li><strong>3 Tokens:</strong> Platform Treasury maintenance and proctoring verification fees.</li>
              <li><strong>2 Tokens:</strong> Transferred directly to the student&apos;s verified wallet balance.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-forest-950">2. University Degree Conferral:</span>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold font-mono text-[10px]">
                3 TOKENS / DEGREE
              </span>
            </div>
            <p className="text-stone-600 leading-relaxed">
              For every student credential or academic degree initiated by the college:
            </p>
            <ul className="space-y-1 list-disc list-inside text-stone-700">
              <li><strong>3 Tokens:</strong> Deducted from the university&apos;s institutional token balance to pay gas and anchor commitment onto Polygon Amoy.</li>
              <li>Enforces that colleges maintain at least 3 tokens before offering a verifiable soulbound degree.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Token Unlocks Ledger */}
      {unlocks.length > 0 && (
        <div className="card-premium overflow-hidden bg-white border border-cream-300">
          <div className="p-4 bg-cream-100/60 border-b border-cream-200 flex items-center justify-between">
            <span className="text-xs font-bold text-forest-950">Recent Profile Unlock Settlements</span>
            <span className="text-[10px] font-mono text-stone-500">Atomic 3/2 Split Transactions</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-cream-50 text-stone-500 uppercase text-[10px] font-bold border-b border-cream-200">
              <tr>
                <th className="p-3">Recruiter / Employer</th>
                <th className="p-3">Student Beneficiary</th>
                <th className="p-3">Platform Treasury</th>
                <th className="p-3">Student Credited</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {unlocks.map((u) => (
                <tr key={u.id} className="hover:bg-cream-50/50">
                  <td className="p-3 font-semibold text-forest-950">{u.orgName}</td>
                  <td className="p-3 text-stone-700">{u.studentName}</td>
                  <td className="p-3 font-mono font-bold text-forest-900">+{u.platformTokens} Tokens</td>
                  <td className="p-3 font-mono font-bold text-amber-800">+{u.studentTokens} Tokens</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      SETTLED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
