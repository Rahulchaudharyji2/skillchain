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
  Award,
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
  degreeStats?: { issuedCount: number; pendingCount: number };
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
  degreeStats = { issuedCount: 0, pendingCount: 0 },
  unlocks,
}: WalletHubClientProps) {
  const [studentBal, setStudentBal] = useState(initialStudentBal);
  const [employerBal, setEmployerBal] = useState(initialEmployerBal);
  const [uniBal, setUniBal] = useState(initialUniBal);

  const [buyingTokens, setBuyingTokens] = useState<number | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<number>(10);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isStudent = currentUserRole === "STUDENT";
  const isRecruiter = currentUserRole === "RECRUITER";
  const isUniversity = currentUserRole === "ISSUER" || currentUserRole === "UNIVERSITY_ADMIN";
  const isAdmin = currentUserRole === "ADMIN";

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
          <span>
            {isStudent
              ? "Candidate Talent Wallet"
              : isRecruiter
              ? "Employer Recruitment Wallet"
              : isUniversity
              ? "University Institutional Wallet"
              : "SkillChain Unified Token Economy"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          {isStudent
            ? `${studentName}'s Token Wallet`
            : isRecruiter
            ? `${employerName} Token Balance & Ledger`
            : isUniversity
            ? `${universityName} Allocation Registry Wallet`
            : "Platform Wallets & Token Allocation"}
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          {isStudent
            ? "Your personal candidate token wallet. You automatically receive +2 tokens directly whenever an employer or HR unlocks your profile to view verified assessment marks and schedule 1:1 interviews."
            : isRecruiter
            ? "Your organization recruitment token balance. Unlock candidate profiles for 5 tokens (3 platform treasury fee + 2 deposited directly to the candidate's wallet) to access unmasked credentials and schedule 1:1 interviews."
            : isUniversity
            ? "Your institutional credentialing token ledger. Allocate 3 tokens per academic degree to cryptographically seal and anchor non-transferable soulbound credentials onto Polygon Amoy."
            : "Complete transparent token ledger across candidate, employer, and university roles."}
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

      {/* Role-Specific Wallet Container */}
      <div className="grid gap-6">
        {/* 1. Student Wallet (Only for Student or Admin) */}
        {(isStudent || isAdmin) && (
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-lg">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-forest-950">{studentName}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                      CANDIDATE TALENT WALLET
                    </span>
                  </div>
                  <span className="text-xs text-stone-500">{currentUserEmail || "Candidate Account"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/student/dashboard"
                  className="px-4 py-2 rounded-xl bg-forest-900 hover:bg-forest-800 text-cream-50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>Student Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/student/credentials"
                  className="px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-forest-950 font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  <span>My Degrees</span>
                </Link>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200">
                <span className="text-xs font-bold uppercase text-amber-900 tracking-wider block">
                  Earned Student Token Balance
                </span>
                <div className="text-4xl font-extrabold font-mono text-amber-950 mt-2 flex items-baseline gap-2">
                  <span>{studentBal}</span>
                  <span className="text-sm font-sans font-semibold text-amber-800">Tokens</span>
                </div>
                <p className="text-xs text-amber-900/80 mt-2 leading-relaxed flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>+2 Tokens</strong> deposited automatically whenever an HR unlocks your profile!</span>
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-stone-500 tracking-wider block">
                    Candidate Earning Rules
                  </span>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    SkillChain directly monetizes your academic achievement and skill proofs. When recruiters discover your verified scores, you receive instant token credit.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-cream-200 text-[11px] font-semibold text-forest-900 flex items-center justify-between">
                  <span>Profile Unlocks Received:</span>
                  <span className="font-mono text-xs font-bold">{unlocks.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. HR / Recruiter Wallet (Only for Recruiter or Admin) */}
        {(isRecruiter || isAdmin) && (
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-forest-900 text-ochre-300 flex items-center justify-center font-bold text-lg">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-forest-950">{employerName} Recruitment Treasury</h3>
                    <span className="px-2 py-0.5 rounded-full bg-forest-100 text-forest-900 text-[10px] font-bold">
                      VERIFIED RECRUITER
                    </span>
                  </div>
                  <span className="text-xs text-stone-500">{currentUserEmail || "Recruiting Operations"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/recruiter/applications"
                  className="px-4 py-2 rounded-xl bg-forest-900 hover:bg-forest-800 text-cream-50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>Review Applicants</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/recruiter/dashboard"
                  className="px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-forest-950 font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <span>Dashboard</span>
                </Link>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-forest-900 text-cream-50">
                <span className="text-xs font-bold uppercase text-ochre-300 tracking-wider block">
                  Available Employer Tokens
                </span>
                <div className="text-4xl font-extrabold font-mono text-white mt-2 flex items-baseline gap-2">
                  <span>{employerBal}</span>
                  <span className="text-sm font-sans font-semibold text-cream-300">Tokens</span>
                </div>
                <p className="text-xs text-cream-200 mt-2 leading-relaxed flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-ochre-300 flex-shrink-0" />
                  <span>Cost: <strong>5 Tokens</strong> per profile unlock (3 Treasury + 2 Student).</span>
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold uppercase text-stone-500 tracking-wider block">
                    Instant Token Top-Up
                  </span>
                  <p className="text-xs text-stone-600 mt-1">
                    Replenish tokens for {employerName} to unlock candidates and schedule 1:1 sessions.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleBuyTokens("RECRUITER", 10)}
                    disabled={buyingTokens !== null}
                    className="flex-1 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 disabled:opacity-50 text-cream-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    {buyingTokens === 10 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-ochre-300" />}
                    <span>Buy 10 Tokens ($10)</span>
                  </button>

                  <button
                    onClick={() => handleBuyTokens("RECRUITER", 25)}
                    disabled={buyingTokens !== null}
                    className="py-2.5 px-4 rounded-xl bg-cream-200 hover:bg-cream-300 text-forest-950 font-bold text-xs"
                  >
                    +25 ($25)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. University Institutional Wallet (Only for University or Admin) */}
        {(isUniversity || isAdmin) && (
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-lg">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-forest-950">{universityName} Institutional Wallet</h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold">
                      OFFICE OF THE REGISTRAR
                    </span>
                  </div>
                  <span className="text-xs text-stone-500">{currentUserEmail || "Institutional Key Holder"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/university/credentials/issue"
                  className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Award className="w-3.5 h-3.5 text-purple-200" />
                  <span>Issue Degree (Uses 3 Tokens)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/university/dashboard"
                  className="px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-forest-950 font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <span>Dashboard</span>
                </Link>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-purple-50/80 border border-purple-200">
                <span className="text-xs font-bold uppercase text-purple-900 tracking-wider block">
                  Institutional Allocation Balance
                </span>
                <div className="text-4xl font-extrabold font-mono text-purple-950 mt-2 flex items-baseline gap-2">
                  <span>{uniBal}</span>
                  <span className="text-sm font-sans font-semibold text-purple-800">Tokens</span>
                </div>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span>Deducts <strong>3 Tokens</strong> for each soulbound degree anchored onto Polygon Amoy.</span>
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs font-bold uppercase text-stone-500 tracking-wider block">
                    Replenish Issuance Tokens
                  </span>
                  <p className="text-xs text-stone-600 mt-1">
                    Degrees issued: <strong>{degreeStats.issuedCount}</strong> active • <strong>{degreeStats.pendingCount}</strong> pending student acceptance.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleBuyTokens("ISSUER", 15)}
                    disabled={buyingTokens !== null}
                    className="flex-1 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    {buyingTokens === 15 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-200" />}
                    <span>Buy 15 Tokens ($15)</span>
                  </button>

                  <button
                    onClick={() => handleBuyTokens("ISSUER", 30)}
                    disabled={buyingTokens !== null}
                    className="py-2.5 px-4 rounded-xl bg-cream-200 hover:bg-cream-300 text-forest-950 font-bold text-xs"
                  >
                    +30 ($30)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Role-Specific Activity / Ledger */}
      {unlocks.length > 0 && (
        <div className="card-premium overflow-hidden bg-white border border-cream-300 shadow-sm">
          <div className="p-4 bg-cream-100/60 border-b border-cream-200 flex items-center justify-between">
            <span className="text-xs font-bold text-forest-950">
              {isStudent ? "Candidate Token Earnings Ledger" : "Recruiter Profile Unlock Settlements"}
            </span>
            <span className="text-[10px] font-mono text-stone-500">Atomic On-Chain Settlement</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-cream-50 text-stone-500 uppercase text-[10px] font-bold border-b border-cream-200">
              <tr>
                <th className="p-3">Recruiter / Employer</th>
                <th className="p-3">Student Beneficiary</th>
                <th className="p-3">Platform Fee</th>
                <th className="p-3">Candidate Credited</th>
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
