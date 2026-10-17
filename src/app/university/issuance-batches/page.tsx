import { Layers, Download, CheckCircle2 } from "lucide-react";
import { BatchUploadClient } from "./BatchUploadClient";

export default function IssuanceBatchesPage() {
  const previousBatches = [
    {
      id: "BATCH-2024-FALL-001",
      department: "School of Engineering",
      recordCount: 142,
      status: "CONFIRMED",
      date: "2024-12-15",
      txHash: "0x82a9471928374619283746192837461928374619283746192837461928374619",
    },
    {
      id: "BATCH-2024-SPRING-002",
      department: "Department of Electrical Engineering & CS",
      recordCount: 310,
      status: "CONFIRMED",
      date: "2024-06-08",
      txHash: "0x1928374619283746192837461928374619283746192837461928374619283746",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Layers className="w-3.5 h-3.5" />
          <span>Batch Operations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Graduation Batches & Reconciliation
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Upload validated CSV records to issue academic degree commitments in bulk. Monitor
          transaction confirmation states and reconcile network delays.
        </p>
      </div>

      <BatchUploadClient />

      <div className="card-premium overflow-hidden bg-white border border-cream-300">
        <div className="p-4 border-b border-cream-200">
          <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500">
            Historical Batch Records
          </h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-cream-100/70 border-b border-cream-200 text-stone-600 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="py-3 px-4">Batch ID</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Records</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Transaction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {previousBatches.map((b) => (
              <tr key={b.id} className="hover:bg-cream-50/60">
                <td className="py-3.5 px-4 font-bold text-forest-950">{b.id}</td>
                <td className="py-3.5 px-4 text-stone-700">{b.department}</td>
                <td className="py-3.5 px-4 font-semibold text-forest-900">{b.recordCount} Graduates</td>
                <td className="py-3.5 px-4 text-stone-500">{b.date}</td>
                <td className="py-3.5 px-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {b.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-[10px] text-stone-400 truncate max-w-xs">
                  {b.txHash}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
