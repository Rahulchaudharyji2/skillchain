import Link from "next/link";
import {
  ShieldCheck,
  Award,
  BookOpenCheck,
  Sparkles,
  QrCode,
  FileCheck2,
  Lock,
  Cpu,
  GraduationCap,
  FolderGit2,
  ArrowRight,
} from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      title: "Non-Transferable Soulbound Registry",
      category: "Blockchain",
      description:
        "Academic degrees and credentials issued directly by accredited university signing keys, anchored as privacy-preserving SHA-256 commitments on Polygon Amoy. Credentials cannot be transferred or sold.",
      icon: ShieldCheck,
      badge: "Polygon Amoy",
    },
    {
      title: "Evidence-Typed Skill Passport",
      category: "Student Passport",
      description:
        "Consolidates university degrees, proctored coding assessments, and GitHub repositories into a shareable passport. Generates dynamic QR codes and embeddable GitHub README badges.",
      icon: QrCode,
      badge: "W3C Verifiable Credentials",
    },
    {
      title: "Sandboxed Code Execution Engine",
      category: "Assessments",
      description:
        "Multi-domain coding challenges executed in isolated processes with strict memory, process, and timeout limits. Undisclosed test cases remain strictly server-side.",
      icon: Cpu,
      badge: "Zero-Eval Isolated VM",
    },
    {
      title: "Consent-Based Proctoring",
      category: "Integrity",
      description:
        "Proportionate browser focus and tab visibility monitoring. Suspicious events are logged to an audit timeline with human reviewer appeal paths rather than automated disqualification.",
      icon: Lock,
      badge: "Audit Ledger",
    },
    {
      title: "AI-Powered Job Creation",
      category: "Recruitment",
      description:
        "Describe your hiring needs in plain natural language. The AI assistant synthesizes responsibilities, required skills, proficiency levels, and matching weights into an editable draft.",
      icon: Sparkles,
      badge: "Zod Schema Validated",
    },
    {
      title: "Explainable Candidate Matching",
      category: "Recruitment",
      description:
        "Deterministic candidate matching engine that strictly separates university-verified degrees, proctored assessments, code projects, and self-declared claims with transparent rationales.",
      icon: Award,
      badge: "Transparent Weights",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-ochre-700">
          Platform Architecture
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-forest-950">
          Core Features of SkillChain
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          Engineered to eliminate resume fraud, provide students with verifiable skill passports, and
          empower recruiters with transparent, evidence-backed hiring decisions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, i) => {
          const IconComponent = feat.icon;
          return (
            <div key={i} className="card-premium p-6 bg-white border border-cream-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-100 text-forest-800">
                    {feat.badge}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  {feat.category}
                </span>
                <h3 className="font-bold text-forest-950 text-base mb-2">{feat.title}</h3>
                <p className="text-xs text-stone-600 leading-relaxed">{feat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-8">
        <Link
          href="/student/passport"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 font-semibold text-xs shadow-md transition-all"
        >
          <span>Explore Verifiable Skill Passport</span>
          <ArrowRight className="w-4 h-4 text-ochre-300" />
        </Link>
      </div>
    </div>
  );
}
