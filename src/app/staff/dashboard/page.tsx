"use client";

import { useStaffLanding } from "@/hooks/use-staff-landing";
import AdminDashboardPage from "@/app/admin/dashboard/page";

export default function StaffDashboardPage() {
  // This is the post-login landing route. A staff member without
  // view_financial is forwarded to their first allowed page instead of being
  // told they have no access.
  const allowed = useStaffLanding("view_financial");
  if (!allowed) return null;
  return <AdminDashboardPage />;
}
