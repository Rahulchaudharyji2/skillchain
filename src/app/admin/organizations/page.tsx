import Link from "next/link";
import { Building2, CheckCircle2, ShieldCheck, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function AdminOrganizationsPage() {
  const orgs = await prisma.organization.findMany({
    include: {
      universityProfile: true,
      employerProfile: true,
      members: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Building2 className="w-3.5 h-3.5" />
          <span>Institutional Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Registered Organizations & Verification
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Accredited universities and corporate employers participating in SkillChain.
        </p>
      </div>

      <div className="card-premium overflow-hidden bg-white border border-cream-300">
        <table className="w-full text-left text-xs">
          <thead className="bg-cream-100/70 border-b border-cream-200 text-stone-600 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="py-3 px-4">Organization Name</th>
              <th className="py-3 px-4">Entity Type</th>
              <th className="py-3 px-4">Domain / Industry</th>
              <th className="py-3 px-4">Accreditation</th>
              <th className="py-3 px-4">Members</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {orgs.map((org) => (
              <tr key={org.id} className="hover:bg-cream-50/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-forest-950">{org.name}</td>
                <td className="py-3.5 px-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-100 text-forest-900">
                    {org.type}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-stone-600">
                  {org.universityProfile?.domain || org.employerProfile?.industry || "N/A"}
                </td>
                <td className="py-3.5 px-4 text-stone-500">
                  {org.universityProfile?.accreditationDetails || org.employerProfile?.headquarters || "Accredited"}
                </td>
                <td className="py-3.5 px-4 font-medium text-forest-900">{org.members.length} Users</td>
                <td className="py-3.5 px-4 text-right">
                  <span className="seal-badge text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    VERIFIED
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
