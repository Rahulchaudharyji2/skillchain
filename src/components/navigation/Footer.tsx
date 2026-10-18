import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Award,
  Sparkles,
  QrCode,
  School,
  Briefcase,
  FileCheck2,
  ExternalLink,
  Github,
  Globe,
  CheckCircle2,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-cream-300 bg-white/95 backdrop-blur-md pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Purpose */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-forest-900 text-ochre-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-ochre-300" />
              </div>
              <span className="font-display font-bold text-xl text-forest-950 tracking-tight">
                SkillChain
              </span>
            </Link>
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm">
              The verifiable credential standard for modern hiring. Bridging university degrees,
              sandboxed proctored assessments, and WebRTC interview evaluations on Polygon Amoy.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Smart Contract: 0x9A7B...17f4 (Polygon Amoy)</span>
            </div>
          </div>

          {/* Column 1: For Students */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest-950">
              For Candidates
            </h4>
            <ul className="space-y-2 text-xs text-stone-600 font-medium">
              <li>
                <Link href="/student/passport" className="hover:text-forest-900 transition-colors flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-ochre-600" />
                  <span>Skill Passport & QR</span>
                </Link>
              </li>
              <li>
                <Link href="/student/assessments" className="hover:text-forest-900 transition-colors">
                  Proctored Assessments
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-forest-900 transition-colors">
                  Job Match Opportunities
                </Link>
              </li>
              <li>
                <Link href="/student/interviews" className="hover:text-forest-900 transition-colors">
                  Live WebRTC Interviews
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-forest-900 transition-colors">
                  Earned Token Wallet
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: For Universities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest-950">
              For Universities
            </h4>
            <ul className="space-y-2 text-xs text-stone-600 font-medium">
              <li>
                <Link href="/university/credentials/issue" className="hover:text-forest-900 transition-colors flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-forest-700" />
                  <span>Issue Degree Credential</span>
                </Link>
              </li>
              <li>
                <Link href="/university/issuance-batches" className="hover:text-forest-900 transition-colors">
                  Batch CSV Conformance
                </Link>
              </li>
              <li>
                <Link href="/university/students" className="hover:text-forest-900 transition-colors">
                  Student Verification Registry
                </Link>
              </li>
              <li>
                <Link href="/university/audit" className="hover:text-forest-900 transition-colors">
                  Cryptographic Audit Trail
                </Link>
              </li>
              <li>
                <Link href="/verify/0x8fae19b489a24dcbe89123849182a47291847192849182938491829384918293" className="hover:text-forest-900 transition-colors">
                  Public Ledger Verifier
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Recruiters */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest-950">
              For Employers
            </h4>
            <ul className="space-y-2 text-xs text-stone-600 font-medium">
              <li>
                <Link href="/recruiter/jobs/new" className="hover:text-forest-900 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-ochre-600" />
                  <span>AI Job Creator</span>
                </Link>
              </li>
              <li>
                <Link href="/recruiter/candidates" className="hover:text-forest-900 transition-colors">
                  Verified Candidate Search
                </Link>
              </li>
              <li>
                <Link href="/recruiter/applications" className="hover:text-forest-900 transition-colors">
                  Applicant Marks & Unlocks
                </Link>
              </li>
              <li>
                <Link href="/recruiter/interviews" className="hover:text-forest-900 transition-colors">
                  1:1 Google Meet WebRTC
                </Link>
              </li>
              <li>
                <Link href="/recruiter/reports" className="hover:text-forest-900 transition-colors">
                  AI Competency Reports
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Verification, Legal */}
        <div className="pt-8 border-t border-cream-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-forest-950">SkillChain Platform</span>
            <span>•</span>
            <span>Built by Team Beast Coders</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              W3C VC & ERC-721 Compliant
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-forest-950 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-forest-950 transition-colors">
              Terms of Service
            </Link>
            <Link href="/security" className="hover:text-forest-950 transition-colors">
              Security Standards
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
