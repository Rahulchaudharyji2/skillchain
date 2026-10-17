import { ShieldCheck, History, UserCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>System Audit Trail</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Platform-Wide Immutable Audit Ledger
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Complete, tamper-evident audit record of all credential creation, revocation, and status
          transitions.
        </p>
      </div>

      <div className="card-premium overflow-hidden bg-white border border-cream-300">
        <table className="w-full text-left text-xs">
          <thead className="bg-cream-100/70 border-b border-cream-200 text-stone-600 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="py-3 px-4">Action Event</th>
              <th className="py-3 px-4">Entity Type</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Metadata Payload</th>
              <th className="py-3 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100 font-mono text-[11px]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-cream-50/60">
                <td className="py-3.5 px-4 font-bold text-forest-900">{log.action}</td>
                <td className="py-3.5 px-4 font-sans text-stone-600">{log.entityType}</td>
                <td className="py-3.5 px-4 font-sans text-forest-950 font-medium">
                  {log.user?.name || "System Actor"}
                </td>
                <td className="py-3.5 px-4 text-stone-500 truncate max-w-sm">{log.detailsJson}</td>
                <td className="py-3.5 px-4 text-right text-stone-400 font-sans text-[11px]">
                  {formatDateTime(log.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
