import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Settings, ShieldCheck, Lock, Bell, Wallet, UserCheck } from "lucide-react";

export default async function StudentSettingsPage() {
  const user = await getCurrentUser();

  const profile = await prisma.studentProfile.findFirst({
    where: {
      OR: [
        { userId: user?.id },
        { user: { email: user?.email || "alex.rivera@student.mit.edu" } },
      ],
    },
    include: { user: true },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Settings className="w-3.5 h-3.5" />
          <span>Security & Consent</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Account Settings & Privacy Controls
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Configure profile privacy, recruiter contact consent, and blockchain wallet binding.
        </p>
      </div>

      <div className="space-y-6">
        {/* Linked Blockchain Wallet */}
        <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-forest-900 text-ochre-300">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-forest-950">Linked Soulbound Wallet</h3>
                <p className="text-xs text-stone-500">
                  Used as the non-transferable recipient address for Polygon Amoy credentials
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              CONNECTED
            </span>
          </div>

          <div className="p-3 rounded-lg bg-cream-50 border border-cream-200 font-mono text-xs text-forest-950 flex items-center justify-between">
            <span>{profile?.user.walletAddress || "0x90F79bf6EB2c4f870365E785982E1f101E93b906"}</span>
            <span className="text-stone-400 font-sans text-[11px]">Polygon Amoy (80002)</span>
          </div>
        </div>

        {/* Privacy & Recruiter Consent */}
        <div className="card-premium p-6 bg-white border border-cream-300 space-y-4">
          <h3 className="font-bold text-sm text-forest-950 flex items-center gap-2">
            <Lock className="w-4 h-4 text-forest-700" />
            Recruiter Discovery & Contact Consent
          </h3>

          <div className="space-y-3 text-xs text-stone-700">
            <label className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-cream-200">
              <div>
                <span className="font-semibold block text-forest-950">
                  Allow Verified Recruiters to Contact You
                </span>
                <span className="text-[11px] text-stone-500">
                  Allows companies with active job matches to send interview invitations
                </span>
              </div>
              <input
                type="checkbox"
                defaultChecked={profile?.allowRecruiterContact ?? true}
                className="h-4 w-4 rounded border-cream-300 text-forest-900 focus:ring-forest-800"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-cream-200">
              <div>
                <span className="font-semibold block text-forest-950">
                  Public Search Engine Indexing
                </span>
                <span className="text-[11px] text-stone-500">
                  Allow your verified skill passport to be indexed on public search engines
                </span>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 rounded border-cream-300 text-forest-900 focus:ring-forest-800"
              />
            </label>
          </div>
        </div>

        {/* Account Correction & Data Governance */}
        <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
          <h3 className="font-bold text-sm text-forest-950">Data Correction & Right of Rectification</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Per academic credential standards, if your university-issued degree or graduation date contains
            an inaccuracy, contact your institutional registrar or submit an official rectification request
            through SkillChain.
          </p>
          <button className="px-4 py-2 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-semibold">
            Submit Rectification Request
          </button>
        </div>
      </div>
    </div>
  );
}
