import Link from "next/link";
import { School, ShieldCheck, CheckCircle2, Award, ArrowRight, Layers, FileCheck } from "lucide-react";

export default function UniversitiesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-ochre-700">
          Institutional Credentialing
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-forest-950">
          Protect Your Institutional Prestige Against Resume Fraud
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          SkillChain provides universities with a cryptographically verifiable degree registry.
          Confer non-transferable awards on Polygon Amoy that employers can verify in milliseconds.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-forest-950">Tamper-Proof On-Chain Anchors</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Eliminate fake diploma mills and forged transcripts. Each degree commitment is signed
            by your authorized registrar key.
          </p>
        </div>

        <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-forest-950">Batch CSV Issuance</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Issue thousands of graduating student credentials in a single batch. Reconcile
            blockchain transactions and automate notification links.
          </p>
        </div>

        <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-forest-950">Privacy by Design</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Personal identifying records remain completely off-chain. Only salted cryptographic
            hashes are stored on Polygon Amoy.
          </p>
        </div>
      </div>

      <div className="card-premium p-8 bg-forest-950 text-cream-50 border border-forest-900 text-center space-y-4">
        <h2 className="text-xl font-bold font-display text-cream-50">
          Experience Institutional Issuance
        </h2>
        <p className="text-xs text-stone-300 max-w-md mx-auto">
          Confer a demo academic degree as MIT Registrar and inspect the live verification state.
        </p>
        <Link
          href="/university/credentials/issue"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ochre-400 hover:bg-ochre-300 text-forest-950 font-bold text-xs shadow-md transition-all"
        >
          <span>Launch University Issuance Portal</span>
          <ArrowRight className="w-4 h-4 text-forest-950" />
        </Link>
      </div>
    </div>
  );
}
