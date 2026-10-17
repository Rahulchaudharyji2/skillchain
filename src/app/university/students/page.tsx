import Link from "next/link";
import { Users, GraduationCap, Award, FilePlus, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function UniversityStudentsPage() {
  const students = await prisma.studentProfile.findMany({
    include: {
      user: true,
      credentials: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
            <Users className="w-3.5 h-3.5" />
            <span>Academic Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
            Enrolled Students Directory
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Directory of matriculated and graduating students. Issue verifiable credentials or inspect
            published skill passports.
          </p>
        </div>

        <Link
          href="/university/issuance-batches"
          className="px-4 py-2 rounded-xl bg-white border border-cream-300 text-forest-900 hover:bg-cream-100 text-xs font-semibold"
        >
          Import Students via CSV
        </Link>
      </div>

      <div className="card-premium overflow-hidden bg-white border border-cream-300">
        <table className="w-full text-left text-xs">
          <thead className="bg-cream-100/70 border-b border-cream-200 text-stone-600 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Major & Degree</th>
              <th className="py-3 px-4">Graduation Year</th>
              <th className="py-3 px-4">GPA</th>
              <th className="py-3 px-4">Credentials</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {students.map((st) => (
              <tr key={st.id} className="hover:bg-cream-50/60 transition-colors">
                <td className="py-3.5 px-4">
                  <span className="font-bold text-forest-950 block">{st.user.name}</span>
                  <span className="text-[11px] text-stone-400 block">{st.user.email}</span>
                </td>
                <td className="py-3.5 px-4 text-stone-700">{st.degree || "Enrolled Candidate"}</td>
                <td className="py-3.5 px-4 text-stone-600">{st.graduationYear || "Class of 2025"}</td>
                <td className="py-3.5 px-4 font-semibold text-forest-900">{st.gpa || "3.92"}</td>
                <td className="py-3.5 px-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-100 text-forest-900">
                    {st.credentials.length} Issued
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/skills/${st.publicPassportSlug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900"
                      title="Inspect Skill Passport"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/university/credentials/issue"
                      className="px-2.5 py-1.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <FilePlus className="w-3 h-3 text-ochre-300" />
                      <span>Issue Degree</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
