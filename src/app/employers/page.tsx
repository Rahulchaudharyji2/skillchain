import Link from "next/link";
import { Briefcase, Sparkles, Award, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

export default function EmployersPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-ochre-700">
          Enterprise Recruitment
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-forest-950">
          Hire with Verifiable Confidence
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          Stop sifting through embellished resumes. Discover candidates ranked by verifiable skill
          evidence, proctored coding assessments, and authentic university degrees.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-forest-950">AI Natural Language Job Specs</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Generate comprehensive job descriptions, required skills, and matching criteria from a
            simple prompt. Edit everything prior to publication.
          </p>
        </div>

        <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-forest-950">Deterministic Evidence Scoring</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Distinguish between university-verified degrees, proctored assessments, and self-declared claims.
            Never rely on black-box ranking algorithms.
          </p>
        </div>

        <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-forest-950">AI Interview Assistant</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Synthesize interview transcripts into structured competency reports with quoted evidence,
            requiring human HR sign-off.
          </p>
        </div>
      </div>

      <div className="card-premium p-8 bg-forest-950 text-cream-50 border border-forest-900 text-center space-y-4">
        <h2 className="text-xl font-bold font-display text-cream-50">
          Discover Verified Candidates Today
        </h2>
        <p className="text-xs text-stone-300 max-w-md mx-auto">
          Explore candidate matches or create a job posting using the AI assistant.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            href="/recruiter/candidates"
            className="px-6 py-3 rounded-xl bg-ochre-400 hover:bg-ochre-300 text-forest-950 font-bold text-xs shadow-md transition-all"
          >
            Discover Candidates
          </Link>
          <Link
            href="/recruiter/jobs/new"
            className="px-6 py-3 rounded-xl bg-forest-900 hover:bg-forest-800 text-cream-50 font-bold text-xs border border-forest-700 shadow-md transition-all"
          >
            Create Job with AI
          </Link>
        </div>
      </div>
    </div>
  );
}
