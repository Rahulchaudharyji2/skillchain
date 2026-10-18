import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { WalletHubClient } from "./WalletHubClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WalletPage() {
  const user = await getCurrentUser();
  const role = user?.role || "STUDENT";

  let studentProfile = null;
  let employerOrg = null;
  let uniOrg = null;
  let unlocks: any[] = [];
  let degreeStats = { issuedCount: 0, pendingCount: 0 };

  if (role === "STUDENT") {
    studentProfile = await prisma.studentProfile.findFirst({
      where: user?.studentProfile?.id ? { id: user.studentProfile.id } : { userId: user?.id },
      include: { user: true },
    });
    if (!studentProfile) {
      studentProfile = await prisma.studentProfile.findFirst({
        where: { user: { email: "alex.rivera@student.mit.edu" } },
        include: { user: true },
      });
    }

    if (studentProfile) {
      unlocks = await prisma.profileUnlock.findMany({
        where: { studentProfileId: studentProfile.id },
        include: {
          organization: true,
          studentProfile: { include: { user: true } },
        },
        orderBy: { unlockedAt: "desc" },
        take: 10,
      });
    }
  } else if (role === "RECRUITER") {
    if (user?.organization?.id) {
      employerOrg = await prisma.organization.findUnique({
        where: { id: user.organization.id },
      });
    } else {
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: user?.id },
        include: { organization: true },
      });
      employerOrg = membership?.organization || (await prisma.organization.findFirst({ where: { type: "EMPLOYER" } }));
    }

    if (employerOrg) {
      unlocks = await prisma.profileUnlock.findMany({
        where: { organizationId: employerOrg.id },
        include: {
          organization: true,
          studentProfile: { include: { user: true } },
        },
        orderBy: { unlockedAt: "desc" },
        take: 10,
      });
    }
  } else if (role === "ISSUER" || role === "UNIVERSITY_ADMIN") {
    if (user?.organization?.id) {
      uniOrg = await prisma.organization.findUnique({
        where: { id: user.organization.id },
      });
    } else {
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: user?.id },
        include: { organization: true },
      });
      uniOrg = membership?.organization || (await prisma.organization.findFirst({ where: { type: "UNIVERSITY" } }));
    }

    if (uniOrg) {
      const [issued, pending] = await Promise.all([
        prisma.credential.count({
          where: { organizationId: uniOrg.id, status: "ACTIVE" },
        }),
        prisma.credential.count({
          where: {
            organizationId: uniOrg.id,
            status: { in: ["INITIATED", "OFFERED", "STUDENT_ACCEPTED"] },
          },
        }),
      ]);
      degreeStats = { issuedCount: issued, pendingCount: pending };
    }
  } else {
    // ADMIN role
    const [sp, eo, uo, unl] = await Promise.all([
      prisma.studentProfile.findFirst({ include: { user: true } }),
      prisma.organization.findFirst({ where: { type: "EMPLOYER" } }),
      prisma.organization.findFirst({ where: { type: "UNIVERSITY" } }),
      prisma.profileUnlock.findMany({
        include: { organization: true, studentProfile: { include: { user: true } } },
        orderBy: { unlockedAt: "desc" },
        take: 10,
      }),
    ]);
    studentProfile = sp;
    employerOrg = eo;
    uniOrg = uo;
    unlocks = unl;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <WalletHubClient
        currentUserRole={role}
        currentUserName={user?.name || "User"}
        currentUserEmail={user?.email || ""}
        studentBalance={studentProfile?.tokenBalance ?? 0}
        employerBalance={employerOrg?.tokenBalance ?? 50}
        universityBalance={uniOrg?.tokenBalance ?? 50}
        studentName={studentProfile?.user.name || user?.name || "Student"}
        employerName={employerOrg?.name || "Employer"}
        universityName={uniOrg?.name || "University"}
        degreeStats={degreeStats}
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
