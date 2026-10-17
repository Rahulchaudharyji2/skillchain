import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { User, ShieldCheck } from "lucide-react";
import { ProfileFormClient } from "./ProfileFormClient";

export default async function StudentProfilePage() {
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
          <User className="w-3.5 h-3.5" />
          <span>Candidate Information</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Edit Profile & External Links
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Manage your personal information, links to your GitHub and LinkedIn profiles, and academic
          background.
        </p>
      </div>

      <ProfileFormClient
        initialData={{
          name: profile?.user.name || "Alex Rivera",
          email: profile?.user.email || "alex.rivera@student.mit.edu",
          headline: profile?.headline || "",
          bio: profile?.bio || "",
          universityName: profile?.universityName || "",
          degree: profile?.degree || "",
          githubUrl: profile?.githubUrl || "",
          linkedinUrl: profile?.linkedinUrl || "",
          portfolioUrl: profile?.portfolioUrl || "",
        }}
      />
    </div>
  );
}
