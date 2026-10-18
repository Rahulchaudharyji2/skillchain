import Link from "next/link";
import {
  School,
  Award,
  Users,
  ShieldCheck,
  FilePlus,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UniversityDashboardPage() {
  const user = await getCurrentUser();

  const [uniOrg, credentials, studentsCount, issuersCount] = await Promise.all([
    prisma.organization.findFirst({
      where: { type: "UNIVERSITY" },
      include: { universityProfile: true },
    }),
    prisma.credential.findMany({
      include: {
        studentProfile: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.studentProfile.count(),
    prisma.issuer.count(),
  ]);

  const pendingAccepted = credentials.filter((c) => c.status === "STUDENT_ACCEPTED");
  const pendingInitiated = credentials.filter((c) => c.status === "INITIATED" || c.status === "OFFERED");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
            <School className="w-3.5 h-3.5" />
            <span>Institutional Credential Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
            {uniOrg?.name || "Massachusetts Institute of Technology"}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Office of the Registrar • Polygon Amoy Authorized Issuer
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/university/issuance-batches"
            className="px-4 py-2.5 rounded-xl bg-white border border-cream-300 text-forest-900 hover:bg-cream-100 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-forest-700" />
            <span>Batch CSV Upload</span>
          </Link>

          <Link
            href="/university/credentials/issue"
            className="px-4 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <FilePlus className="w-3.5 h-3.5 text-ochre-300" />
            <span>Issue Academic Credential</span>
          </Link>
        </div>
      </div>

      {/* Action Banner for Student Accepted Degrees */}
      {pendingAccepted.length > 0 && (
        <div className="card-premium p-5 bg-gradient-to-r from-emerald-50 to-sky-50 border-2 border-emerald-400 shadow-md space-y-3 animate-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 inline-block mb-1">
                  🎉 {pendingAccepted.length} Student Degree(s) Accepted & Ready to Seal
                </span>
                <h3 className="text-base font-bold text-forest-950">
                  Student Permission Granted via MetaMask
                </h3>
                <p className="text-xs text-stone-600">
                  Students have accepted their degree proposals. Click to permanently confer the Soulbound Seal onto Polygon Amoy.
                </p>
              </div>
            </div>

            <Link
              href="/university/credentials"
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <span>Confer Soulbound Seals Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Issued Degrees</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-display text-forest-950">{credentials.length}</p>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
            100% Cryptographically Anchored
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Active Enrolled Students</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-display text-forest-950">{studentsCount}</p>
          <span className="text-[10px] text-stone-500 font-medium block mt-1">
            Verified Academic Records
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Authorized Signers</span>
            <School className="w-4 h-4 text-forest-700" />
          </div>
          <p className="text-2xl font-bold font-display text-forest-950">{issuersCount}</p>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
            On-Chain Issuer Keys
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Registry Chain</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-sm font-bold font-mono text-forest-950 mt-1">Polygon Amoy</p>
          <span className="text-[10px] text-stone-400 font-mono block mt-1">Chain ID: 80002</span>
        </div>
      </div>

      {/* Main Grid: Credential Activity & Issuance Action */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Issued Credentials List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-forest-950">Recent Issued Credentials</h2>
            <Link
              href="/university/credentials"
              className="text-xs font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1"
            >
              <span>View All Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {credentials.map((cred) => {
              const isInitiated = cred.status === "INITIATED" || cred.status === "OFFERED";
              const isAccepted = cred.status === "STUDENT_ACCEPTED";
              const isActive = cred.status === "ACTIVE";

              return (
                <div key={cred.id} className="card-premium p-4 bg-white border border-cream-300 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs flex-shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-forest-950 block">
                        {cred.title} — {cred.studentProfile.user.name}
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        Field: {cred.fieldOfStudy} • Conferred {formatDate(cred.issuanceDate)}
                      </span>
                      {cred.txHash && (
                        <span className="text-[10px] font-mono text-stone-400 block truncate max-w-sm">
                          Tx: {cred.txHash}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : isAccepted
                          ? "bg-sky-100 text-sky-800 border border-sky-300"
                          : isInitiated
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-stone-100 text-stone-800"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {isInitiated
                        ? "INITIATED"
                        : isAccepted
                        ? "STUDENT ACCEPTED"
                        : isActive
                        ? "ACTIVE SOULBOUND"
                        : cred.status}
                    </span>

                    {isActive && (
                      <Link
                        href={`/verify/${cred.credId}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900"
                        title="Inspect Public Verification"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Issuance Quick Launch & Policy (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-premium p-6 bg-forest-950 text-cream-50 border-forest-900 space-y-4">
            <h3 className="font-bold text-sm text-cream-50 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-ochre-400" />
              Cryptographic Issuance Wizard
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Issue tamper-proof academic awards for graduating students. Each award generates a
              salted SHA-256 commitment hash and records an on-chain registration event on Polygon
              Amoy.
            </p>
            <Link
              href="/university/credentials/issue"
              className="w-full py-2.5 rounded-xl bg-ochre-400 hover:bg-ochre-300 text-forest-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <FilePlus className="w-4 h-4 text-forest-900" />
              <span>Launch Single Issuance</span>
            </Link>
          </div>

          <div className="card-premium p-5 bg-white border border-cream-300 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-forest-900">
              Department Accreditation
            </h3>
            <p className="text-xs text-stone-600">
              {uniOrg?.universityProfile?.accreditationDetails || "NECHE Accredited Academic Institution"}
            </p>
            <div className="pt-2 border-t border-cream-200 text-[11px] font-mono text-stone-500">
              Issuer Address:
              <br />
              <span className="text-forest-950 break-all">
                {uniOrg?.universityProfile?.issuerAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
