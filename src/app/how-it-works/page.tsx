import Link from "next/link";
import {
  School,
  BookOpenCheck,
  QrCode,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "01",
      title: "University Issues Academic Award",
      actor: "Accredited University Registrar",
      description:
        "The university administrator enters or imports graduating student records via validated CSV. SkillChain creates a signed W3C Verifiable Credential and anchors a privacy-preserving SHA-256 commitment on Polygon Amoy.",
      icon: School,
    },
    {
      number: "02",
      title: "Student Earns Assessment Proofs",
      actor: "Student Candidate",
      description:
        "Students take proctored coding challenges evaluated in isolated server-side sandboxes against hidden test suites. High scores issue verified skill credentials attached to their tamper-proof skill passport.",
      icon: BookOpenCheck,
    },
    {
      number: "03",
      title: "Public Verification & QR Sharing",
      actor: "Employer / Third-Party Verifier",
      description:
        "Anyone with the credential identifier or QR code can inspect issuer authenticity, cryptographic commitment integrity, and active on-chain status without accessing private student identifiers.",
      icon: QrCode,
    },
    {
      number: "04",
      title: "Explainable Matching & AI Interviews",
      actor: "Corporate Recruiter",
      description:
        "Recruiters generate job specs from natural-language prompts, discover talent ranked by verified skill evidence, schedule interviews, and review human-verified AI interview reports.",
      icon: Sparkles,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-ochre-700">
          The Verification Flow
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-forest-950">
          How SkillChain Works
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          From institutional degree conferral to sandboxed assessments and explainable AI hiring.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((st, i) => {
          const IconComp = st.icon;
          return (
            <div
              key={i}
              className="card-premium p-6 sm:p-8 bg-white border border-cream-300 flex flex-col sm:flex-row items-start gap-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-forest-900 text-ochre-300 flex items-center justify-center font-display font-extrabold text-xl flex-shrink-0 shadow-md">
                {st.number}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-forest-950">{st.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-100 text-forest-800">
                    {st.actor}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{st.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-premium p-8 bg-cream-100/60 border border-cream-300 text-center space-y-4">
        <h3 className="text-lg font-bold text-forest-950">Ready to Experience the Demo Story?</h3>
        <p className="text-xs text-stone-600 max-w-lg mx-auto">
          Issue a university credential, verify it on-chain, browse candidate skill evidence, and review
          an AI interview synthesis.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            href="/university/credentials/issue"
            className="px-5 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold shadow-sm"
          >
            Issue Degree Credential
          </Link>
          <Link
            href="/verify/0x8fae19b489a24dcbe89123849182a47291847192849182938491829384918293"
            className="px-5 py-2.5 rounded-xl bg-white border border-cream-300 text-forest-900 hover:bg-cream-100 text-xs font-semibold shadow-sm"
          >
            Inspect On-Chain Proof
          </Link>
        </div>
      </div>
    </div>
  );
}
