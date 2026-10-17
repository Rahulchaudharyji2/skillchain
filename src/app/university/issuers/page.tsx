import { School, ShieldCheck, CheckCircle2, UserCheck, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function UniversityIssuersPage() {
  const issuers = await prisma.issuer.findMany({
    include: { organization: true },
    orderBy: { registeredAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
            <School className="w-3.5 h-3.5" />
            <span>Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
            Authorized Department Issuers
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Only verified institutional signing keys registered on the Polygon Amoy registry can issue
            official academic credentials.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {issuers.map((issuer) => (
          <div key={issuer.id} className="card-premium p-6 bg-white border border-cream-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center font-bold">
                <School className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400">
                  {issuer.organization.name}
                </span>
                <h3 className="font-bold text-forest-950 text-base">{issuer.department}</h3>
                <span className="font-mono text-xs text-stone-600 block mt-0.5">
                  Signing Wallet: {issuer.walletAddress}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="seal-badge text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                ON-CHAIN AUTHORIZED
              </span>
              <p className="text-[10px] text-stone-400 font-mono">
                Registered: {formatDate(issuer.registeredAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
