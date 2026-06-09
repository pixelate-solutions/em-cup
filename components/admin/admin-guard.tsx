import { redirect } from "next/navigation";

import { isAdminAuthenticated } from "@/lib/auth";

export async function AdminGuard({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
