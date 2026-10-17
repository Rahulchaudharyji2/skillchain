import { School, ShieldCheck, CheckCircle2, Award } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function AdminIssuersPage() {
  const issuers = await prisma.issuer.findMany({
    include: { organization: true },
    orderBy: { registeredAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <School className="w-3.5 h-3.5" />
          <span>Accreditation Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Authorized Institutional Issuers
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Review and govern signing keys authorized to issue academic degrees on the Polygon Amoy
          registry.
        </p>
      </div>

      <div className="card-premium overflow-hidden bg-white border border-cream-300">
        <table className="w-full text-left text-xs">
          <thead className="bg-cream-100/70 border-b border-cream-200 text-stone-600 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="py-3 px-4">Institution</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Authorized Wallet Address</th>
              <th className="py-3 px-4">Registration Tx</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100 font-mono text-[11px]">
            {issuers.map((iss) => (
              <tr key={iss.id} className="hover:bg-cream-50/60">
                <td className="py-3.5 px-4 font-sans font-bold text-forest-950">
                  {iss.organization.name}
                </td>
                <td className="py-3.5 px-4 font-sans text-stone-700">{iss.department}</td>
                <td className="py-3.5 px-4 text-stone-600 truncate max-w-xs">{iss.walletAddress}</td>
                <td className="py-3.5 px-4 text-stone-400 truncate max-w-xs">{iss.registeredTx}</td>
                <td className="py-3.5 px-4 text-right font-sans">
                  <span className="seal-badge text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    AUTHORIZED
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
