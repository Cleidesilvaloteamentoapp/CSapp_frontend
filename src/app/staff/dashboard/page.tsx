"use client";

import { useStaffLanding } from "@/hooks/use-staff-landing";
import { DashboardView } from "@/app/admin/dashboard/_components/dashboard-view";

export default function StaffDashboardPage() {
  // This is the post-login landing route. A staff member without
  // view_financial is forwarded to their first allowed page instead of being
  // told they have no access.
  const allowed = useStaffLanding("view_financial");
  if (!allowed) return null;
  // basePath keeps every card inside /staff: re-exporting the admin page sent
  // staff to /admin/..., where the admin layout immediately bounced them back.
  return <DashboardView basePath="/staff" />;
}
