import Link from "next/link";
import {
  ShieldCheck,
  Award,
  BookOpenCheck,
  Sparkles,
  ArrowRight,
  QrCode,
  CheckCircle2,
  FileCheck2,
  ExternalLink,
  Lock,
  Cpu,
  GraduationCap,
  FolderGit2,
  User,
  School,
  Briefcase,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  // Query live metrics from the database
  const [credentialCount, skillCount, jobCount, studentCount] = await Promise.all([
    prisma.credential.count(),
    prisma.skill.count(),
    prisma.job.count(),
    prisma.studentProfile.count(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-cream-200 bg-gradient-to-b from-cream-100/60 to-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900/10 border border-forest-800/20 text-xs font-semibold text-forest-900">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Live on Polygon Amoy Testnet & W3C Verifiable Credentials</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-forest-950 tracking-tight leading-[1.12]">
                Verifiable Skills, <br />
                <span className="text-forest-700 underline decoration-ochre-400 decoration-wavy decoration-2">
                  Trusted Hiring.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed">
                SkillChain connects universities, students, assessment runners, and employers
                through an immutable skill passport. Verify academic degrees on-chain, validate code
                in sandboxed tests, and match candidates using explainable AI.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/student/passport"
                  className="px-6 py-3 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4 text-ochre-300" />
                  <span>View Student Skill Passport</span>
                </Link>
                <Link
                  href="/university/credentials/issue"
                  className="px-6 py-3 rounded-xl bg-white border border-cream-300 text-forest-900 hover:bg-cream-100 font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <School className="w-4 h-4 text-forest-700" />
                  <span>Issue Degree Credential</span>
                </Link>
                <Link
                  href="/recruiter/jobs/new"
                  className="px-6 py-3 rounded-xl bg-ochre-100 border border-ochre-300 text-ochre-900 hover:bg-ochre-200 font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-ochre-700" />
                  <span>AI Job Creator</span>
                </Link>
              </div>

              {/* Live Metric Tickers */}
              <div className="pt-6 grid grid-cols-4 gap-4 border-t border-cream-300/80">
                <div>
                  <p className="text-2xl font-bold font-display text-forest-900">{credentialCount}</p>
                  <p className="text-xs text-stone-500 font-medium">On-Chain Credentials</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-forest-900">{skillCount}</p>
                  <p className="text-xs text-stone-500 font-medium">Verified Skills</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-forest-900">{jobCount}</p>
                  <p className="text-xs text-stone-500 font-medium">Active Job Matches</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-forest-900">{studentCount}</p>
                  <p className="text-xs text-stone-500 font-medium">Student Passports</p>
                </div>
              </div>
            </div>

            {/* Right Hero Card: Live Interactive Credential Verifier */}
            <div className="lg:col-span-5">
              <div className="card-premium p-6 relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-ochre-100 rounded-full blur-2xl opacity-60"></div>
                <div className="flex items-center justify-between border-b border-cream-200 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-forest-950">
                        Live On-Chain Credential
                      </h2>
                      <p className="text-[11px] text-stone-500">Polygon Amoy Registry Check</p>
                    </div>
                  </div>
                  <span className="seal-badge text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ACTIVE & CONFIRMED
                  </span>
                </div>

                {/* Credential Content preview */}
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
                    <p className="text-[10px] uppercase font-bold text-stone-400">Awarded To</p>
                    <p className="font-bold text-sm text-forest-950 mt-0.5">Alex Rivera</p>
                    <p className="text-stone-600 text-[11px]">MIT — BS in Computer Science (Summa Cum Laude)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-cream-50 border border-cream-200">
                      <span className="text-[10px] text-stone-400 font-semibold block">ISSUER</span>
                      <span className="font-semibold text-forest-900 truncate block">MIT Registrar</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-cream-50 border border-cream-200">
                      <span className="text-[10px] text-stone-400 font-semibold block">INTEGRITY</span>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold">SHA-256 MATCH</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-900 text-cream-100 font-mono text-[10px] space-y-1">
                    <div className="flex justify-between text-stone-400">
                      <span>Commitment:</span>
                      <span className="text-ochre-400">0x8fae19b4...8293</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Transaction:</span>
                      <span className="text-emerald-400">0x82a94719...4619</span>
                    </div>
                  </div>

                  <Link
                    href="/verify/0x8fae19b489a24dcbe89123849182a47291847192849182938491829384918293"
                    className="w-full py-2.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileCheck2 className="w-4 h-4 text-ochre-300" />
                    <span>Open Public Verification Page</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principle: Evidence Distinction Banner */}
      <section className="py-16 bg-cream-100/70 border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-bold tracking-widest text-ochre-700 mb-2">
              Core Product Principle
            </h2>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-forest-950">
              Never Treat All Skills as Equivalent
            </h3>
            <p className="text-sm text-stone-600 mt-3 leading-relaxed">
              SkillChain establishes cryptographic separation between academic awards, proctored
              coding tests, project code commits, and self-reported claims.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {/* 1. University Degree */}
            <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-forest-950">University Degree</h4>
                <p className="text-xs text-stone-500 mt-1 leading-snug">
                  Digitally signed by authorized institutional registrar & committed on-chain.
                </p>
              </div>
              <span className="mt-4 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 w-fit">
                Institutional Attestation
              </span>
            </div>

            {/* 2. Assessment Verified */}
            <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-forest-950">Assessment Skill</h4>
                <p className="text-xs text-stone-500 mt-1 leading-snug">
                  Proven via proctored code executions and server-side hidden test cases.
                </p>
              </div>
              <span className="mt-4 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 w-fit">
                Sandboxed & Graded
              </span>
            </div>

            {/* 3. Project Evidence */}
            <div className="p-4 rounded-xl bg-white border border-sky-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center mb-3">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-forest-950">Project Evidence</h4>
                <p className="text-xs text-stone-500 mt-1 leading-snug">
                  Supported by verifiable GitHub repositories, commit history, and live deployments.
                </p>
              </div>
              <span className="mt-4 text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200 w-fit">
                Artifact Backed
              </span>
            </div>

            {/* 4. Self-Declared */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center mb-3">
                  <User className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-forest-950">Self-Declared</h4>
                <p className="text-xs text-stone-500 mt-1 leading-snug">
                  Claimed by candidate without external proof. Clearly labelled to recruiters.
                </p>
              </div>
              <span className="mt-4 text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 w-fit">
                Unverified Claim
              </span>
            </div>

            {/* 5. AI Candidate Recommendation */}
            <div className="p-4 rounded-xl bg-white border border-purple-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center mb-3">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-forest-950">AI Match Explainer</h4>
                <p className="text-xs text-stone-500 mt-1 leading-snug">
                  Transparent, deterministic matching calculation with clear skill gap breakdowns.
                </p>
              </div>
              <span className="mt-4 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 w-fit">
                Explainable Rationale
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Role Deep-Dives */}
      <section className="py-20 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-forest-950">
              A Complete Platform for the Entire Hiring Ecosystem
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Student Feature */}
            <div className="card-premium p-6 flex flex-col justify-between">
              <div>
                <div className="p-3 w-12 h-12 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-forest-950 mb-2">Student Skill Passport</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Consolidate your university degree, proctored coding assessments, and GitHub
                  projects into a tamper-proof passport. Generate shareable QR codes, verification
                  URLs, and embeddable GitHub README badges.
                </p>
              </div>
              <Link
                href="/student/passport"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-forest-800 hover:text-forest-950"
              >
                <span>Explore Alex Rivera&apos;s Passport</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* University Feature */}
            <div className="card-premium p-6 flex flex-col justify-between">
              <div>
                <div className="p-3 w-12 h-12 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center mb-4">
                  <School className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-forest-950 mb-2">University Registry</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Issue cryptographically signed credentials individually or via batch CSV. Anchored
                  as non-transferable commitments on Polygon Amoy. Protects institutional prestige
                  against resume fraud.
                </p>
              </div>
              <Link
                href="/university/credentials/issue"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-forest-800 hover:text-forest-950"
              >
                <span>Launch Credential Issuance Wizard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Recruiter Feature */}
            <div className="card-premium p-6 flex flex-col justify-between">
              <div>
                <div className="p-3 w-12 h-12 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-forest-950 mb-2">AI Recruiter Engine</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Create comprehensive job drafts from natural-language prompts. Discover candidates
                  filtered by verified evidence, review explainable match scores, and synthesize
                  interview transcripts into validated reports.
                </p>
              </div>
              <Link
                href="/recruiter/jobs/new"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-forest-800 hover:text-forest-950"
              >
                <span>Create Job with AI Assistant</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-cream-300 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-forest-900" />
            <span className="font-display font-bold text-forest-950 text-sm">SkillChain</span>
            <span className="text-xs text-stone-400">| Team Beast Coders</span>
          </div>
          <p className="text-xs text-stone-500">
            Polygon Amoy Smart Contract:{" "}
            <code className="text-forest-800 font-mono text-[11px]">
              0x9A7B31b6B7C37bE75E4De6A4eFa6E93c9E3917F4
            </code>
          </p>
        </div>
      </footer>
    </div>
  );
}
