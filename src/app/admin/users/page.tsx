import { Users, Shield, GraduationCap, Briefcase, School } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      studentProfile: true,
      organizationMembers: { include: { organization: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Users className="w-3.5 h-3.5" />
          <span>Identity & Access</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          User Accounts & Role Permissions
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Complete identity register across students, university issuers, recruiters, and platform
          administrators.
        </p>
      </div>

      <div className="card-premium overflow-hidden bg-white border border-cream-300">
        <table className="w-full text-left text-xs">
          <thead className="bg-cream-100/70 border-b border-cream-200 text-stone-600 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Organization / Institution</th>
              <th className="py-3 px-4">Connected Wallet</th>
              <th className="py-3 px-4 text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-cream-50/60">
                <td className="py-3.5 px-4">
                  <span className="font-bold text-forest-950 block">{u.name}</span>
                  <span className="text-[11px] text-stone-400 block">{u.email}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-100 text-forest-900">
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-stone-700">
                  {u.organizationMembers[0]?.organization.name || u.studentProfile?.universityName || "Independent"}
                </td>
                <td className="py-3.5 px-4 font-mono text-[10px] text-stone-500 truncate max-w-xs">
                  {u.walletAddress || "Unlinked"}
                </td>
                <td className="py-3.5 px-4 text-right text-stone-400">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
