import Link from "next/link";
import {
  ShieldAlert,
  Building2,
  Users,
  Award,
  Sparkles,
  BookOpenCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Activity,
  Server,
  Lock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [userCount, orgCount, credentialCount, attemptCount, auditCount] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.credential.count(),
    prisma.assessmentAttempt.count(),
    prisma.auditLog.count(),
  ]);

  const recentOrgs = await prisma.organization.findMany({
    include: {
      universityProfile: true,
      employerProfile: true,
    },
    take: 4,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Platform Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          SkillChain Administration & Registry Health
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          System oversight, institutional issuer verification, skill ontology governance, and
          cryptographic audit monitoring.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card-premium p-4 bg-white border border-cream-300">
          <span className="text-xs font-semibold text-stone-400 block mb-1">Total Users</span>
          <p className="text-2xl font-bold font-display text-forest-950">{userCount}</p>
          <span className="text-[10px] text-stone-500 block mt-1">Across 4 Personas</span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <span className="text-xs font-semibold text-stone-400 block mb-1">Organizations</span>
          <p className="text-2xl font-bold font-display text-forest-950">{orgCount}</p>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
            Universities & Employers
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <span className="text-xs font-semibold text-stone-400 block mb-1">On-Chain Credentials</span>
          <p className="text-2xl font-bold font-display text-forest-950">{credentialCount}</p>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
            Polygon Amoy Anchored
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <span className="text-xs font-semibold text-stone-400 block mb-1">Assessments Taken</span>
          <p className="text-2xl font-bold font-display text-forest-950">{attemptCount}</p>
          <span className="text-[10px] text-purple-700 font-semibold block mt-1">
            Proctored Sandboxes
          </span>
        </div>

        <div className="card-premium p-4 bg-white border border-cream-300">
          <span className="text-xs font-semibold text-stone-400 block mb-1">Audit Ledger</span>
          <p className="text-2xl font-bold font-display text-forest-950">{auditCount}</p>
          <span className="text-[10px] text-stone-500 block mt-1">Immutable Logs</span>
        </div>
      </div>

      {/* Operational Health Status */}
      <div className="card-premium p-6 bg-white border border-cream-300 space-y-4">
        <h3 className="font-bold text-sm text-forest-950 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Operational Node & Provider Status</span>
        </h3>

        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-cream-50 border border-cream-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-forest-950 block">Polygon Amoy Testnet</span>
              <span className="text-stone-500 font-mono text-[10px]">Chain ID: 80002</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              OPERATIONAL
            </span>
          </div>

          <div className="p-3 rounded-xl bg-cream-50 border border-cream-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-forest-950 block">Sandboxed Code Runner</span>
              <span className="text-stone-500 text-[10px]">Isolated V8 Process VM</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              READY
            </span>
          </div>

          <div className="p-3 rounded-xl bg-cream-50 border border-cream-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-forest-950 block">AI Intelligence Layer</span>
              <span className="text-stone-500 text-[10px]">Structured Zod Engine</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Organizations Oversight */}
      <div className="card-premium overflow-hidden bg-white border border-cream-300 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-forest-950">Registered Institutions & Employers</h2>
          <Link
            href="/admin/organizations"
            className="text-xs font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1"
          >
            <span>Manage All Orgs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {recentOrgs.map((org) => (
            <div key={org.id} className="p-4 rounded-xl bg-cream-50 border border-cream-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-forest-950 text-sm">{org.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-900 text-cream-50">
                  {org.type}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {org.universityProfile?.accreditationDetails || org.employerProfile?.industry || "Accredited Entity"}
              </p>
              <div className="pt-2 border-t border-cream-200 flex items-center justify-between text-[11px] text-stone-400">
                <span>Verified: {org.verified ? "Yes" : "Pending"}</span>
                <span>Created {formatDate(org.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
