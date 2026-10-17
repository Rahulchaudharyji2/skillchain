import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { JobCreationWizardClient } from "./JobCreationWizardClient";

export default function NewJobPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        href="/recruiter/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-forest-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Jobs</span>
      </Link>

      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Job Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Create Job with AI Assistant
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Enter a prompt describing the requirements. The AI synthesizes job requirements, mandatory
          skill verification thresholds, and candidate matching criteria.
        </p>
      </div>

      <JobCreationWizardClient />
    </div>
  );
}
