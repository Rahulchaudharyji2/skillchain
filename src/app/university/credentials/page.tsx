import Link from "next/link";
import { Award, ShieldCheck, CheckCircle2, ExternalLink, FilePlus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { CredentialStatusActions } from "./CredentialStatusActions";

export default async function UniversityCredentialsPage() {
  const credentials = await prisma.credential.findMany({
    include: {
      studentProfile: { include: { user: true } },
      organization: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
            <Award className="w-3.5 h-3.5" />
            <span>Academic Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
            Issued Credential Records
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            View, verify, suspend, or revoke issued academic degrees according to institutional policy.
          </p>
        </div>

        <Link
          href="/university/credentials/issue"
          className="px-4 py-2 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <FilePlus className="w-3.5 h-3.5 text-ochre-300" />
          <span>Issue New Credential</span>
        </Link>
      </div>

      <div className="card-premium overflow-hidden bg-white border border-cream-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100/70 border-b border-cream-200 text-stone-600 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Student & Recipient</th>
                <th className="py-3 px-4">Credential Award</th>
                <th className="py-3 px-4">Commitment & Tx</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {credentials.map((cred) => {
                const isInitiated = cred.status === "INITIATED" || cred.status === "OFFERED";
                const isAccepted = cred.status === "STUDENT_ACCEPTED";
                const isActive = cred.status === "ACTIVE";

                return (
                  <tr
                    key={cred.id}
                    className={`transition-colors ${
                      isAccepted
                        ? "bg-sky-50/50 hover:bg-sky-100/40"
                        : isInitiated
                        ? "bg-amber-50/40 hover:bg-amber-100/30"
                        : "hover:bg-cream-50/60"
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-forest-950 block">
                        {cred.studentProfile.user.name}
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        {cred.studentProfile.user.email}
                      </span>
                      {cred.studentProfile.user.walletAddress && (
                        <span className="text-[10px] font-mono text-emerald-800 block truncate max-w-[140px]">
                          🦊 {cred.studentProfile.user.walletAddress}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-forest-900 block">{cred.title}</span>
                      <span className="text-[11px] text-stone-500 block">
                        {cred.fieldOfStudy} ({cred.grade})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[10px]">
                      <span className="text-stone-400 block">Commitment:</span>
                      <span className="text-forest-900 block truncate max-w-[140px]">
                        {cred.commitment}
                      </span>
                      {cred.txHash && (
                        <a
                          href={`https://amoy.polygonscan.com/tx/${cred.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-semibold pt-0.5"
                        >
                          <span>Tx: {cred.txHash.substring(0, 8)}...</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500">{formatDate(cred.issuanceDate)}</td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isActive
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : isAccepted
                            ? "bg-sky-100 text-sky-800 border border-sky-300"
                            : isInitiated
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : cred.status === "SUSPENDED"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {isInitiated
                          ? "INITIATED (WAITING ACCEPT)"
                          : isAccepted
                          ? "STUDENT ACCEPTED (READY)"
                          : isActive
                          ? "ACTIVE SOULBOUND"
                          : cred.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isActive && (
                          <Link
                            href={`/verify/${cred.credId}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900"
                            title="Verify Public Proof"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        <CredentialStatusActions
                          credentialId={cred.id}
                          currentStatus={cred.status}
                          studentName={cred.studentProfile.user.name}
                          studentWallet={cred.studentProfile.user.walletAddress}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
