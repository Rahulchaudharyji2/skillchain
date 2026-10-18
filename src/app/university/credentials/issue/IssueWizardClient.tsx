"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  School,
  Award,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  User,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

interface StudentOption {
  id: string;
  name: string;
  email: string;
  universityName: string | null;
  degree: string | null;
}

interface IssueWizardClientProps {
  students: StudentOption[];
}

export function IssueWizardClient({ students }: IssueWizardClientProps) {
  const router = useRouter();

  const [studentProfileId, setStudentProfileId] = useState(students[0]?.id || "");
  const [title, setTitle] = useState("Bachelor of Science in Computer Science");
  const [degreeName, setDegreeName] = useState("Bachelor of Science");
  const [fieldOfStudy, setFieldOfStudy] = useState("Computer Science & Engineering");
  const [grade, setGrade] = useState("Summa Cum Laude (GPA 3.95)");
  const [issuanceDate, setIssuanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [mode, setMode] = useState<"OFFER" | "DIRECT_MINT">("OFFER");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    credentialId: string;
    txHash: string;
    commitment: string;
    status?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/university/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId,
          title,
          degreeName,
          fieldOfStudy,
          grade,
          issuanceDate,
          mode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({ ...data, status: mode === "OFFER" ? "OFFERED" : "ACTIVE" });
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error("Issuance failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="card-premium p-8 bg-white border-2 border-emerald-300 text-center space-y-6 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <span className="seal-badge text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {result.status === "OFFERED" ? "HANDSHAKE STEP 1: DEGREE PROPOSAL INITIATED" : "ON-CHAIN SOULBOUND CONFERRED"}
          </span>
          <h2 className="text-2xl font-bold font-display text-forest-950">
            {result.status === "OFFERED"
              ? "Degree Conferral Initiated for Student"
              : "Academic Credential Successfully Conferred"}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {result.status === "OFFERED"
              ? "Handshake request has been dispatched to the student's portal. Once the student connects MetaMask and accepts, you can confer the permanent Soulbound seal on Polygon Amoy."
              : "Privacy-preserving commitment recorded on Polygon Amoy testnet."}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-forest-950 text-cream-100 font-mono text-xs text-left space-y-2">
          <div>
            <span className="text-stone-400 text-[10px] block">Credential ID:</span>
            <span className="text-ochre-300 break-all">{result.credentialId}</span>
          </div>
          <div>
            <span className="text-stone-400 text-[10px] block">SHA-256 Commitment:</span>
            <span className="text-stone-300 break-all">{result.commitment}</span>
          </div>
          <div>
            <span className="text-stone-400 text-[10px] block">Transaction Hash:</span>
            <span className="text-emerald-400 break-all">{result.txHash}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/verify/${result.credentialId}`}
            target="_blank"
            className="px-5 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <span>Inspect Public Verification Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-ochre-300" />
          </Link>

          <button
            onClick={() => {
              setResult(null);
              router.refresh();
            }}
            className="px-5 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-semibold"
          >
            Issue Another Credential
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
      {/* Step 1: Select Student */}
      <div>
        <label className="text-xs font-semibold text-stone-700 block mb-1.5">
          Select Graduate / Recipient
        </label>
        <select
          value={studentProfileId}
          onChange={(e) => setStudentProfileId(e.target.value)}
          className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
        >
          {students.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name} ({st.email}) — Current Degree: {st.degree || "Enrolled"}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: Award Details */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">Credential Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">Degree Classification</label>
          <input
            type="text"
            value={degreeName}
            onChange={(e) => setDegreeName(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
            required
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">Field of Study</label>
          <input
            type="text"
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">Honors / GPA Grade</label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">Conferral Date</label>
          <input
            type="date"
            value={issuanceDate}
            onChange={(e) => setIssuanceDate(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
            required
          />
        </div>
      </div>

      {/* Conferral Mode Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-stone-700 block">
          Select Conferral Workflow
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <div
            onClick={() => setMode("OFFER")}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              mode === "OFFER"
                ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500"
                : "border-cream-300 bg-white hover:border-cream-400"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>🦊</span>
                <span>Assign as Soulbound Degree</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                Consensual
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-snug">
              University offers degree. Student connects MetaMask wallet to accept and soulbound-lock it. Non-transferable once claimed.
            </p>
          </div>

          <div
            onClick={() => setMode("DIRECT_MINT")}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              mode === "DIRECT_MINT"
                ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                : "border-cream-300 bg-white hover:border-cream-400"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-forest-950 flex items-center gap-1.5">
                <span>⚡</span>
                <span>Direct Institutional Mint</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Instant
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-snug">
              Directly mints and confirms the verifiable credential onto Polygon Amoy registry immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Blockchain Notice */}
      <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 text-xs text-stone-600 leading-relaxed">
        <p className="font-semibold text-forest-950 mb-1">Cryptographic Privacy Guarantee:</p>
        Personal identifiers and transcripts remain securely off-chain. The system generates a salted
        SHA-256 commitment of the academic record and submits the hash to the Polygon Amoy credential
        registry.
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 disabled:opacity-50 text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-ochre-300" />
              <span>Submitting Commitment to Polygon Amoy...</span>
            </>
          ) : (
            <>
              <span>Issue Credential & Commit On-Chain</span>
              <ArrowRight className="w-4 h-4 text-ochre-300" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
