import { getCurrentUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/navigation/Sidebar";

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
      <Sidebar
        role={user?.role || "RECRUITER"}
        user={{
          name: user?.name || "Elena Rostova",
          email: user?.email || "recruiter@stripe.com",
          avatarUrl: user?.avatarUrl,
          organizationName: user?.organization?.name || "Stripe",
        }}
      />
      <div className="flex-1 bg-cream-50 p-6 sm:p-8 overflow-y-auto">{children}</div>
    </div>
  );
}
