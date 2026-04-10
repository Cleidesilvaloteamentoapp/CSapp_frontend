"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminDevelopmentsPage from "@/app/admin/developments/page";

export default function StaffDevelopmentsPage() {
  useRequirePermission("view_lots");
  return <AdminDevelopmentsPage />;
}
