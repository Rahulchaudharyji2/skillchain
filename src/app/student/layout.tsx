import { getCurrentUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/navigation/Sidebar";
import { redirect } from "next/navigation";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar
        role={user?.role || "STUDENT"}
        user={{
          name: user?.name || "Alex Rivera",
          email: user?.email || "alex.rivera@student.mit.edu",
          avatarUrl: user?.avatarUrl,
          headline: user?.studentProfile?.headline || "Student & Candidate",
        }}
      />
      <div className="flex-1 bg-cream-50 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</div>
    </div>
  );
}
