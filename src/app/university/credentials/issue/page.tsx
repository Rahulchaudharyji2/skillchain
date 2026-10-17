import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { School, Award } from "lucide-react";
import { IssueWizardClient } from "./IssueWizardClient";

export default async function UniversityIssuePage() {
  const students = await prisma.studentProfile.findMany({
    include: { user: true },
  });

  const formattedStudents = students.map((s) => ({
    id: s.id,
    name: s.user.name,
    email: s.user.email,
    universityName: s.universityName,
    degree: s.degree,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Award className="w-3.5 h-3.5" />
          <span>Institutional Conferral</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Issue Verifiable Academic Degree
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Confer digitally signed degrees anchored on Polygon Amoy. The issued credential provides
          graduates with an immutable, shareable proof for employers.
        </p>
      </div>

      <IssueWizardClient students={formattedStudents} />
    </div>
  );
}
