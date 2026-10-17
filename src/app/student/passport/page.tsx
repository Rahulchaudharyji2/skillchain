import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PassportManagerClient } from "./PassportManagerClient";
import { QrCode, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function StudentPassportPage() {
  const user = await getCurrentUser();

  const profile = await prisma.studentProfile.findFirst({
    where: {
      OR: [
        { userId: user?.id },
        { user: { email: user?.email || "alex.rivera@student.mit.edu" } },
      ],
    },
    include: {
      user: true,
      credentials: true,
      studentSkills: true,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicSlug = profile?.publicPassportSlug || "alex-rivera-passport";
  const publicUrl = `${appUrl}/skills/${publicSlug}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <QrCode className="w-3.5 h-3.5" />
          <span>Verifiable Skill Passport</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          My Verifiable Skill Passport & QR Sharing
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Aggregates your university degree, proctored coding assessments, and GitHub projects into
          a single verifiable link. Share via QR code, URL, or your GitHub README.
        </p>
      </div>

      <PassportManagerClient
        publicUrl={publicUrl}
        publicSlug={publicSlug}
        initialIsPublic={profile?.isPassportPublic ?? true}
        candidateName={profile?.user.name || "Alex Rivera"}
      />
    </div>
  );
}
