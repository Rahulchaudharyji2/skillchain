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
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function StudentCredentialsPage() {
  const user = await getCurrentUser();

  const profile = await prisma.studentProfile.findFirst({
    where: {
      OR: [
        { userId: user?.id },
        { user: { email: user?.email || "alex.rivera@student.mit.edu" } },
      ],
    },
    include: {
      credentials: {
        include: {
          organization: true,
          statusEvents: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

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
        {credentials.map((cred) => (
          <div key={cred.id} className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-900">
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
                <span className="seal-badge text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  STATUS: {cred.status}
                </span>

                <Link
                  href={`/verify/${cred.credId}`}
                  className="px-3.5 py-1.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>Public Proof</span>
                  <ExternalLink className="w-3 h-3 text-ochre-300" />
                </Link>
              </div>
            </div>

            {/* Cryptographic Proof Details */}
            <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 space-y-1">
                <span className="text-[10px] font-sans text-stone-400 font-semibold block">
                  SHA-256 COMMITMENT HASH
                </span>
                <span className="text-forest-950 break-all text-[11px] block">{cred.commitment}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 space-y-1">
                <span className="text-[10px] font-sans text-stone-400 font-semibold block">
                  POLYGON AMOY TRANSACTION
                </span>
                <span className="text-forest-950 break-all text-[11px] block">{cred.txHash}</span>
              </div>
            </div>

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
        ))}
      </div>
    </div>
  );
}
