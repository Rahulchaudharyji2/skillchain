import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { WalletHubClient } from "./WalletHubClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WalletPage() {
  const user = await getCurrentUser();

  // Fetch balances for all three roles so user can see and test token flows transparently
  const [studentProfile, employerOrg, uniOrg, unlocks, recentPayments] = await Promise.all([
    prisma.studentProfile.findFirst({
      where: { user: { email: "alex.rivera@student.mit.edu" } },
      include: { user: true },
    }),
    prisma.organization.findFirst({
      where: { type: "EMPLOYER" },
    }),
    prisma.organization.findFirst({
      where: { type: "UNIVERSITY" },
    }),
    prisma.profileUnlock.findMany({
      include: {
        organization: true,
        studentProfile: { include: { user: true } },
      },
      orderBy: { unlockedAt: "desc" },
      take: 5,
    }),
    prisma.payment.findMany({
      include: { organization: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <WalletHubClient
        currentUserRole={user?.role || "STUDENT"}
        currentUserName={user?.name || "User"}
        currentUserEmail={user?.email || ""}
        studentBalance={studentProfile?.tokenBalance ?? 0}
        employerBalance={employerOrg?.tokenBalance ?? 50}
        universityBalance={uniOrg?.tokenBalance ?? 50}
        studentName={studentProfile?.user.name || "Alex Rivera"}
        employerName={employerOrg?.name || "Stripe"}
        universityName={uniOrg?.name || "MIT"}
        unlocks={unlocks.map((u) => ({
          id: u.id,
          orgName: u.organization.name,
          studentName: u.studentProfile.user.name,
          platformTokens: u.platformTokens,
          studentTokens: u.studentTokens,
          unlockedAt: u.unlockedAt.toISOString(),
        }))}
      />
    </div>
  );
}
