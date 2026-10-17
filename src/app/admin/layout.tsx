import { getCurrentUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/navigation/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
      <Sidebar
        role={user?.role || "ADMIN"}
        user={{
          name: user?.name || "Marcus Vance",
          email: user?.email || "admin@skillchain.org",
          avatarUrl: user?.avatarUrl,
          organizationName: "Platform Administration",
        }}
      />
      <div className="flex-1 bg-cream-50 p-6 sm:p-8 overflow-y-auto">{children}</div>
    </div>
  );
}
