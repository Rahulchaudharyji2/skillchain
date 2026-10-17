import { Building2, ShieldCheck, Sparkles, CreditCard, Settings } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function RecruiterSettingsPage() {
  const org = await prisma.organization.findFirst({
    where: { type: "EMPLOYER" },
    include: { employerProfile: true, billingConfiguration: true },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Settings className="w-3.5 h-3.5" />
          <span>Employer Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Company Profile & Recruiting Settings
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Manage company accreditation, AI matching weights, and subscription plan quotas.
        </p>
      </div>

      <div className="space-y-6">
        {/* Company Profile Info */}
        <div className="card-premium p-6 bg-white border border-cream-300 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-lg">
                {org?.name.charAt(0) || "S"}
              </div>
              <div>
                <h3 className="font-bold text-base text-forest-950">{org?.name}</h3>
                <p className="text-xs text-stone-500">{org?.employerProfile?.industry}</p>
              </div>
            </div>
            <span className="seal-badge text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              VERIFIED EMPLOYER
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs text-stone-700 pt-2 border-t border-cream-200">
            <div>
              <span className="text-stone-400 font-semibold block mb-0.5">HEADQUARTERS</span>
              <p className="font-medium">{org?.employerProfile?.headquarters}</p>
            </div>
            <div>
              <span className="text-stone-400 font-semibold block mb-0.5">COMPANY SIZE</span>
              <p className="font-medium">{org?.employerProfile?.companySize} Employees</p>
            </div>
          </div>
        </div>

        {/* Billing & Subscription Module */}
        <div className="card-premium p-6 bg-white border border-cream-300 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-forest-950 text-sm">
              <CreditCard className="w-4 h-4 text-forest-700" />
              <span>Subscription & Recruitment Entitlements</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-forest-900 text-cream-50 text-[10px] font-bold">
              {org?.billingConfiguration?.planTier || "ENTERPRISE"} TIER
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs p-4 rounded-xl bg-cream-50 border border-cream-200">
            <div>
              <span className="text-stone-400 block text-[11px]">Active Job Posting Capacity:</span>
              <span className="font-bold text-forest-950 text-base">
                {org?.billingConfiguration?.maxJobPostings || 50} Postings
              </span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">Candidate Match Engine:</span>
              <span className="font-bold text-emerald-800 text-base">
                Unlimited Verifications
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
