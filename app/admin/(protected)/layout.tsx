import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminNav />
      <div className="golf-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </div>
    </AdminGuard>
  );
}
