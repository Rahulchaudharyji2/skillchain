import Link from "next/link";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Building,
  GraduationCap,
  Copy,
  Lock,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { MetaMaskClaimDegree } from "@/components/blockchain/MetaMaskClaimDegree";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentCredentialsPage() {
  const user = await getCurrentUser();

  let profile =
    user?.role === "STUDENT"
      ? await prisma.studentProfile.findFirst({
          where: { userId: user.id },
          include: {
            credentials: {
              include: {
                organization: true,
                statusEvents: { orderBy: { createdAt: "desc" } },
              },
            },
          },
        })
      : null;

  if (!profile) {
    profile = await prisma.studentProfile.findFirst({
      where: { user: { email: "alex.rivera@student.mit.edu" } },
      include: {
        credentials: {
          include: {
            organization: true,
            statusEvents: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });
  }

  const credentials = profile?.credentials || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Award className="w-3.5 h-3.5" />
          <span>Verifiable Credentials</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Academic Degrees & Issued Credentials
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Non-transferable soulbound academic awards issued by authorized university registrars and
          anchored to Polygon Amoy.
        </p>
      </div>

      <div className="space-y-6">
        {credentials.map((cred) => {
          const isPendingAcceptance =
            cred.status === "OFFERED" ||
            cred.status === "PENDING_ACCEPTANCE" ||
            cred.status === "INITIATED";
          const isAccepted = cred.status === "STUDENT_ACCEPTED";
          const isActive = cred.status === "ACTIVE";

          return (
            <div
              key={cred.id}
              className={`card-premium p-6 sm:p-8 bg-white border space-y-6 ${
                isPendingAcceptance
                  ? "border-2 border-amber-400 bg-amber-50/20 shadow-md"
                  : isAccepted
                  ? "border-2 border-sky-400 bg-sky-50/20 shadow-md"
                  : "border-cream-300"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-2xl ${
                      isPendingAcceptance
                        ? "bg-amber-200 text-amber-950"
                        : isAccepted
                        ? "bg-sky-200 text-sky-950"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      {cred.organization.name}
                    </span>
                    <h2 className="text-lg font-bold text-forest-950">{cred.title}</h2>
                    <p className="text-xs text-stone-600">
                      {cred.fieldOfStudy} • Grade: {cred.grade}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      isPendingAcceptance
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : isAccepted
                        ? "bg-sky-100 text-sky-900 border border-sky-300"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    STATUS: {isPendingAcceptance ? "AWAITING YOUR ACCEPTANCE" : isAccepted ? "ACCEPTED (WAITING FINAL SEAL)" : "ACTIVE SOULBOUND"}
                  </span>

                  {isActive && (
                    <Link
                      href={`/verify/${cred.credId}`}
                      className="px-3.5 py-1.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>Public Proof</span>
                      <ExternalLink className="w-3 h-3 text-ochre-300" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Action Banner for Offered or Accepted Soulbound Degree */}
              {(isPendingAcceptance || isAccepted) && (
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    isPendingAcceptance
                      ? "bg-amber-50 border-amber-300"
                      : "bg-sky-50 border-sky-300"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-forest-950">
                    <span>🎓</span>
                    <span>
                      {isPendingAcceptance
                        ? "University Has Initiated Degree Conferral — Accept with MetaMask"
                        : "Degree Proposal Accepted by You — Waiting for University Final Seal"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {isPendingAcceptance
                      ? `${cred.organization.name} has initiated your academic conferral. To verify your identity and authorize your student wallet on Polygon Amoy, connect MetaMask and accept below. Once accepted, the university registrar confers the permanent Soulbound seal.`
                      : `You have approved this degree conferral with your MetaMask wallet. The university registrar will now confer the final permanent Soulbound seal on Polygon Amoy. Once sealed, this degree will be permanently non-transferable.`}
                  </p>
                  <MetaMaskClaimDegree
                    credentialId={cred.id}
                    credIdHex={cred.credId}
                    title={cred.title}
                    institutionName={cred.organization.name}
                    initialStatus={cred.status}
                  />
                </div>
              )}

              {/* Cryptographic Proof Details */}
              <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 space-y-1">
                  <span className="text-[10px] font-sans text-stone-400 font-semibold block">
                    SHA-256 COMMITMENT HASH
                  </span>
                  <span className="text-forest-950 break-all text-[11px] block">{cred.commitment}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans text-stone-400 font-semibold block">
                      POLYGON AMOY TRANSACTION
                    </span>
                    {cred.txHash && (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${cred.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-sans text-emerald-800 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <span>PolygonScan</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <span className="text-forest-950 break-all text-[11px] block">{cred.txHash || "Pending Final Soulbound Mint"}</span>
                </div>
              </div>

              {/* Soulbound Lock Guarantee */}
              {isActive && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-semibold">Soulbound Locked:</span>
                  <span className="text-stone-600">This degree is non-transferable and permanently bound to student wallet on Polygon Amoy.</span>
                </div>
              )}

            {/* Status History */}
            {cred.statusEvents.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
                  Lifecycle Audit Events
                </span>
                <div className="space-y-1.5">
                  {cred.statusEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2 rounded-lg bg-cream-50 border border-cream-100 flex items-center justify-between text-[11px] text-stone-600"
                    >
                      <span>
                        Transition to <strong>{ev.newStatus}</strong>: {ev.reason}
                      </span>
                      <span className="text-stone-400">{formatDate(ev.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
